import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'guildEdit',
  // Applies validated edits to a guild's spawn configuration (channel, status, weight) and returns {status,error,value} as JSON.
  params: [
    {
      name: 'guild',
      // The guild ID
      type: 'String',
      required: true,
    },
    {
      name: 'body',
      // The JSON request body
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[guild;$replace[$env[guild];null;]]
  $if[$and[$get[guild]!=;$replaceRegex[$get[guild];\\\\d{15,25};;]==]==false;
    $return[{"status":400,"error":"Invalid Discord guild ID."}]
  ]
  $if[$guildExists[$get[guild]]==false;
    $return[{"status":404,"error":"The bot is not in that Discord guild or the guild was not found."}]
  ]
  $let[body;$replace[$env[body];null;]]
  $let[lock;$mutex[acquire;spawn:$get[guild]]]
  $let[current;$getGuildVar[spawnConfig;$get[guild]]]
  $let[plan;$js[(() => {
    const err = (msg) => JSON.stringify({ status: 400, error: msg });
    let body = {};
    try {
      body = JSON.parse(ctx.getKeyword('body') || 'null') || {};
    } catch (e) {
      return err('The body is not valid JSON.');
    }
    if (typeof body !== 'object' || Array.isArray(body)) return err('The body must be a JSON object.');

    const guildId = ctx.getKeyword('guild');
    const cur = JSON.parse(ctx.getKeyword('current') || 'null') || {};
    cur.config_channel = cur.config_channel ?? '';
    cur.status = cur.status ?? 'enabled';
    cur.weight = Number(cur.weight) || 0;

    let edited = false;

    // 1. Channel (channel / spawn_channel / config_channel)
    let channelVal = body.channel !== undefined ? body.channel : (body.config_channel !== undefined ? body.config_channel : body.spawn_channel);
    if (channelVal !== undefined) {
      if (channelVal === null || channelVal === '') {
        cur.config_channel = '';
        edited = true;
      } else {
        const chStr = String(channelVal).trim();
        if (!chStr.split('').every((c) => c >= '0' && c <= '9') || chStr.length < 15 || chStr.length > 25) {
          return err('Invalid channel ID.');
        }
        const ch = ctx.client?.channels?.cache?.get(chStr);
        if (ch && ch.guildId && ch.guildId !== guildId) {
          return err('That channel belongs to a different server.');
        }
        cur.config_channel = chStr;
        edited = true;
      }
    }

    // 2. Status (status / enabled / spawn)
    let statusVal = body.status !== undefined ? body.status : (body.enabled !== undefined ? body.enabled : body.spawn);
    if (statusVal !== undefined) {
      if (statusVal === true || statusVal === 'enabled' || statusVal === 'enable') {
        cur.status = 'enabled';
        edited = true;
      } else if (statusVal === false || statusVal === 'disabled' || statusVal === 'disable') {
        cur.status = 'disabled';
        edited = true;
      } else {
        return err('status must be enabled or disabled.');
      }
    }

    // 3. Weight (optional spawn weight accumulator)
    if (body.weight !== undefined) {
      const wStr = String(body.weight).trim();
      if (!wStr.split('').every((c) => c >= '0' && c <= '9')) return err('weight must be a non-negative whole number.');
      const n = parseInt(wStr, 10);
      if (n > 1000000) return err('weight is too large.');
      cur.weight = n;
      edited = true;
    }

    if (!edited) {
      return err('Send at least one of: channel (or config_channel/spawn_channel), status (or enabled), weight.');
    }

    return JSON.stringify({
      status: 200,
      value: {
        guild: guildId,
        config_channel: cur.config_channel,
        status: cur.status,
        weight: cur.weight
      },
      data: JSON.stringify(cur)
    });
  })()]]
  $jsonLoad[p;$get[plan]]
  $if[$env[p;status]!=200;
    $!mutex[release;spawn:$get[guild];$get[lock]]
    $return[$get[plan]]
  ]
  $setGuildVar[spawnConfig;$env[p;data];$get[guild]]
  $!mutex[release;spawn:$get[guild];$get[lock]]
  $jsonLoad[done;{"status":200}]
  $!jsonSet[done;value;$env[p;value]]
  $return[$env[done]]
  `,
});
