import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessEvalAllowed',
  // Returns whether eval may run here: a direct message, or the home server (and the control channel when one is set).
  params: [
  ],
  code: `
  $if[$guildID==;$return[true]]
  $let[home;$js[process.env.HOME_GUILD_ID || '']]
  $if[$or[$get[home]==;$guildID!=$get[home]];$return[false]]
  $jsonLoad[acc;$getGlobalVar[access]]
  $let[control;$env[acc;evalChannel]]
  $return[$or[$get[control]==;$get[control]==$channelID]]
  `,
});
