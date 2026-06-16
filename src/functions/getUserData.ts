import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'getUserData',
  // Get info about a user's collectibles from the "userCollectibles" variable.
  params: [
    {
      name: 'user',
      // The user whose collectibles' data to get.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value/info to retrieve, leave blank to get json data.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[data;$getUserVar[userCollectibles;$env[user]]]
  $return[$env[data;$env[value]]]
  `,
});
