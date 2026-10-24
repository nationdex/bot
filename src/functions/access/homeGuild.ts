import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'homeGuild',
  // Returns the home server id (HOME_GUILD_ID), or an empty string when it is not set.
  params: [
  ],
  code: `$return[$js[process.env.HOME_GUILD_ID || '']]`,
});
