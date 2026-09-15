import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Message,
  MessageFlags,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { Compiler, ForgeClient, Interpreter } from '@tryforge/forgescript';
import { inspect } from 'util';
import { createRequire } from 'module';
import { slashes as defaultSlashes } from '../config/slash';
import { variables as defaultVariables } from '../config/variables';

export interface EvalSession {
  threadId: string;
  channelId: string;
  guildId: string;
  userId: string;
  userName: string;
  createdAt: number;
}

// Granular Developer & Bot Operator IDs
export const AUTHORIZED_DEV_IDS = new Set<string>([
  '525421785001361408', // Ariel Aram (PND26 Operator)
  '1421877908456083578', // Ayansh
  '903681538842054686',  // Aditya
  '910837428862984213',
]);

// Memory store of active eval sessions keyed by thread ID
export const activeSessions = new Map<string, EvalSession>();

/**
 * Check if a user is authorized to run evaluation commands.
 * Checks against the explicit operator list, the Discord application owner,
 * and all members of the owner team if applicable.
 */
export async function isAuthorizedUser(userId: string, client?: any): Promise<boolean> {
  if (!userId) return false;
  if (AUTHORIZED_DEV_IDS.has(userId)) return true;

  if (client?.application) {
    try {
      if (!client.application.owner) {
        await client.application.fetch();
      }
      const owner = client.application.owner;
      if (owner) {
        if (owner.id && owner.id === userId) return true;
        if (owner.members && typeof owner.members.has === 'function' && owner.members.has(userId)) return true;
      }
    } catch {
      // Ignore network errors on fetch
    }
  }

  return false;
}

/**
 * Handles the `/admin eval` slash command.
 * Creates a dedicated thread for the session and configures permissions.
 */
export async function startEvalSlash(ctx: any): Promise<void> {
  const interaction = ctx.interaction;
  if (!interaction) return;

  const user = interaction.user;
  const channel = interaction.channel as TextChannel;
  const client = ctx.client ?? interaction.client;

  // 1. Check authorization
  const authorized = await isAuthorizedUser(user.id, client);
  if (!authorized) {
    await interaction.reply({
      content: '❌ **Access Denied**: You do not have permission to start an evaluation session.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 2. Validate channel capability
  if (!channel || typeof channel.threads?.create !== 'function') {
    await interaction.reply({
      content: '❌ **Error**: Evaluation sessions cannot be created in this channel type (threads not supported).',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 3. Create thread (try private first, fallback to public if permissions require)
  let thread: ThreadChannel;
  const sanitizedName = `eval-session-${user.username.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'dev'}`;

  try {
    thread = await channel.threads.create({
      name: sanitizedName,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread,
      reason: `Developer eval session requested by ${user.tag} (${user.id})`,
    });
  } catch {
    try {
      thread = await channel.threads.create({
        name: sanitizedName,
        autoArchiveDuration: 60,
        type: ChannelType.PublicThread,
        reason: `Developer eval session requested by ${user.tag} (${user.id})`,
      });
    } catch (err: any) {
      await interaction.reply({
        content: `❌ **Failed to create thread**: ${err?.message || err}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  // 4. Add the user to the thread
  try {
    await thread.members.add(user.id);
  } catch {
    // Ignore if already in thread or auto-joined
  }

  // 5. Register session
  activeSessions.set(thread.id, {
    threadId: thread.id,
    channelId: channel.id,
    guildId: channel.guild?.id || '',
    userId: user.id,
    userName: user.tag || user.username,
    createdAt: Date.now(),
  });

  // 6. Post welcome message inside the thread
  const embed = new EmbedBuilder()
    .setTitle('🧪 Eval Session Started')
    .setColor(0x4000ff)
    .setDescription(
      `Welcome <@${user.id}>! This thread is your private interactive console.\n\n` +
      `• **Execution**: Any message you send here will be evaluated directly.\n` +
      `• **ForgeScript**: Send ForgeScript DSL directly (e.g. \`$ping\`, \`$getGlobalVar[config]\`).\n` +
      `• **JavaScript**: Prefix your message with \`js:\` to evaluate raw JavaScript (e.g. \`js: ctx.client.guilds.cache.size\`).\n` +
      `• **Security**: Only you (<@${user.id}>) can run code in this thread. Other users' messages are blocked.\n` +
      `• **Termination**: Type \`exit\`, \`stop\`, or click **End Session** below to close and archive this thread.`
    )
    .setFooter({ text: `Session Thread: ${thread.id} • Auto-archives after 60m inactivity` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`eval_session_stop_${thread.id}`)
      .setLabel('End Session')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🛑')
  );

  await thread.send({ embeds: [embed], components: [row] });

  // 7. Ephemeral confirmation in original channel
  await interaction.reply({
    content: `✅ **Evaluation session active**: Please proceed to <#${thread.id}> to evaluate code.`,
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Handles messages sent inside an active eval session thread directly.
 */
export async function handleThreadMessageDirect(message: Message, client: ForgeClient): Promise<void> {
  const session = activeSessions.get(message.channelId);
  if (!session) return; // Fast return: channel is not an active eval session

  const authorId = message.author.id;

  // Strict check: Only the user who opened the session can execute code
  if (authorId !== session.userId) {
    try {
      if (typeof message.delete === 'function') {
        await message.delete();
      }
    } catch {
      // Ignore if lacking delete permission
    }
    return;
  }

  const rawContent = (message.content || '').trim();
  if (!rawContent) return;

  // Check exit triggers
  const lower = rawContent.toLowerCase();
  if (['exit', 'stop', 'quit', 'close', 'end'].includes(lower)) {
    activeSessions.delete(message.channelId);
    await message.reply('🛑 **Evaluation session closed.** Archiving thread...');
    try {
      const ch = message.channel as ThreadChannel;
      if (ch && typeof ch.setArchived === 'function') {
        await ch.setLocked(true);
        await ch.setArchived(true);
      }
    } catch {
      // Ignore
    }
    return;
  }

  // Strip code blocks if formatted with markdown
  let code = rawContent;
  if (code.startsWith('```') && code.endsWith('```')) {
    code = code.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }

  const startTime = performance.now();
  const isJs = code.toLowerCase().startsWith('js:');
  const actualCode = isJs ? code.slice(3).trim() : code;

  try {
    let output: any;

    if (isJs) {
      // Setup rich lexical and global context for JavaScript evaluation
      let req: any = null;
      try {
        req = typeof require !== 'undefined' ? require : createRequire(__filename);
      } catch {
        // Ignore in environments where createRequire is unavailable
      }

      const channel = message.channel;
      const guild = message.guild;
      const user = message.author;
      const author = message.author;
      const member = message.member;

      const ctx = {
        client,
        message,
        channel,
        guild,
        user,
        author,
        member,
      };

      const slashes = defaultSlashes;
      const config = defaultVariables;
      const DataBase = (client as any)?.db?.DataBase ?? (client as any)?.db?.pg ?? null;

      // Populate globalThis for zero-failure fallback
      if (req) (globalThis as any).require = req;
      (globalThis as any).ctx = ctx;
      (globalThis as any).client = client;
      (globalThis as any).message = message;
      (globalThis as any).channel = channel;
      (globalThis as any).guild = guild;
      (globalThis as any).user = user;
      (globalThis as any).author = author;
      (globalThis as any).member = member;
      (globalThis as any).slashes = slashes;
      (globalThis as any).config = config;
      (globalThis as any).DataBase = DataBase;

      // Suppress unused local warnings while maintaining lexical bindings
      void [req, ctx, channel, guild, user, author, member, slashes, config, DataBase];

      // JavaScript evaluation with full context in scope
      output = await eval(actualCode);
      if (typeof output !== 'string') {
        output = inspect(output, { depth: 2, maxArrayLength: 50 });
      }
    } else {
      // ForgeScript evaluation
      const res = await Interpreter.run({
        client,
        obj: message,
        command: null,
        data: Compiler.compile(actualCode),
        doNotSend: true,
      });
      output = res === null || res === undefined ? '' : String(res);
    }

    const elapsed = (performance.now() - startTime).toFixed(2);
    const displayOutput = output === '' ? '[No output / return value]' : output;

    if (displayOutput.length > 1900) {
      const buffer = Buffer.from(displayOutput, 'utf-8');
      await message.reply({
        content: `📤 **Eval Result** (\`${elapsed}ms\`):\nOutput exceeded 2,000 characters, sent as file.`,
        files: [{ attachment: buffer, name: 'eval_result.txt' }],
      });
    } else {
      await message.reply({
        content: `📤 **Eval Result** (\`${elapsed}ms\`):\n\`\`\`${isJs ? 'js' : ''}\n${displayOutput}\n\`\`\``,
      });
    }
  } catch (err: any) {
    const elapsed = (performance.now() - startTime).toFixed(2);
    const errMsg = err?.message || String(err);
    await message.reply({
      content: `❌ **Eval Error** (\`${elapsed}ms\`):\n\`\`\`\n${errMsg.slice(0, 1900)}\n\`\`\``,
    });
  }
}

/**
 * Handles button interactions for stopping the session directly.
 */
export async function handleButtonInteractionDirect(interaction: any, client: ForgeClient): Promise<void> {
  const customId = interaction.customId || '';
  const threadId = customId.replace('eval_session_stop_', '');
  const session = activeSessions.get(threadId);

  // Authorize: Either session creator or whitelisted developer
  const isCreator = session && session.userId === interaction.user.id;
  const isDev = await isAuthorizedUser(interaction.user.id, client);

  if (!isCreator && !isDev) {
    await interaction.reply({
      content: '❌ You are not authorized to stop this evaluation session.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  activeSessions.delete(threadId);
  await interaction.reply('🛑 **Evaluation session closed.** Archiving thread...');

  try {
    const channel = interaction.channel as ThreadChannel;
    if (channel && typeof channel.setArchived === 'function') {
      await channel.setLocked(true);
      await channel.setArchived(true);
    }
  } catch {
    // Ignore
  }
}

/**
 * Attaches native Discord.js event handlers to the client.
 * Completely eliminates overhead and ForgeScript command interference on non-session messages.
 */
export function initEvalSessionEvents(client: ForgeClient): void {
  client.on('messageCreate', async (message: Message) => {
    if (!message || message.author?.bot) return;
    if (!activeSessions.has(message.channelId)) return;
    await handleThreadMessageDirect(message, client);
  });

  client.on('interactionCreate', async (interaction: any) => {
    if (!interaction.isButton?.()) return;
    const customId = interaction.customId || '';
    if (!customId.startsWith('eval_session_stop_')) return;
    await handleButtonInteractionDirect(interaction, client);
  });
}

// Bind to globalThis for zero-failure resolution across bundling boundaries
(globalThis as any).__ndxEvalSession = {
  AUTHORIZED_DEV_IDS,
  activeSessions,
  isAuthorizedUser,
  startEvalSlash,
  initEvalSessionEvents,
};
