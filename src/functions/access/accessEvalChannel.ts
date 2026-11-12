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
  $let[valid;$or[$get[channel]==;$replaceRegex[$get[channel];\\\\d{15,25};;]==]]
  $if[$get[valid]==false;$return[invalid]]
  $let[lock;$mutex[acquire;access]]
  $jsonLoad[acc;$accessData]
  $!jsonSet[acc;evalChannel;"$get[channel]"]
  $setGlobalVar[access;$env[acc]]
  $!mutex[release;access;$get[lock]]
  $!accessLog[$get[actor];eval-channel;$get[channel];$if[$get[channel]==;cleared;set]]
  $return[ok]
  `,
});
