import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistHistoryPush',
  // Adds an entry to the blacklist history of a target (newest first, capped at 100).
  params: [
    {
      name: 'type',
      // user or guild
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The user or guild id
      type: 'String',
      required: true,
    },
    {
      name: 'action',
      // blacklist or unblacklist
      type: 'String',
      required: true,
    },
    {
      name: 'moderator',
      // The moderator id
      type: 'String',
      required: true,
    },
    {
      name: 'reason',
      // The reason
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[raw;$if[$env[type]==guild;$getGuildVar[blacklistHistory;$env[id]];$getUserVar[blacklistHistory;$env[id]]]]
  $let[next;$js[
    const list = JSON.parse(ctx.getKeyword('raw') || 'null') || new Array();
    list.unshift({ action: ctx.getEnvironmentKey('action'), moderator: ctx.getEnvironmentKey('moderator'), reason: String(ctx.getEnvironmentKey('reason') || '').replace(/^null$/, ''), timestamp: Date.now() });
    JSON.stringify(list.slice(0, 100))
  ]]
  $if[$env[type]==guild;$setGuildVar[blacklistHistory;$get[next];$env[id]];$setUserVar[blacklistHistory;$get[next];$env[id]]]
  `,
});
