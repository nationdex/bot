import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessEvalChannel',
  // Sets or clears the eval control channel. Owner only. Returns a status.
  params: [
    {
      name: 'channel',
      // The channel id, or empty to clear
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[actor;$authorID]
  $let[channel;$replace[$env[channel];null;]]
  $if[$hasCap[$get[actor];*]==false;$return[owner_only]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $let[valid;$js[ctx.getKeyword('channel').length === 0 || (ctx.getKeyword('channel').length > 14 && ctx.getKeyword('channel').length < 26 && ctx.getKeyword('channel').split('').every((c) => c >= '0' && c <= '9'))]]
  $if[$get[valid]==false;$return[invalid]]
  $let[lock;$mutex[acquire;access]]
  $let[acc;$accessData]
  $setGlobalVar[access;$js[
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    acc.evalChannel = ctx.getKeyword('channel');
    JSON.stringify(acc)
  ]]
  $!mutex[release;access;$get[lock]]
  $!accessLog[$get[actor];eval-channel;$get[channel];$if[$get[channel]==;cleared;set]]
  $return[ok]
  `,
});
