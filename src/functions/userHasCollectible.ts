import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'userHasCollectible',
  // Checks if a user has a specific collectible
  params: [
    {
      name: 'user',
      // The user to check
      type: 'String',
      required: true
    },
    {
      name: 'collectibleID',
      // The collectible ID to check
      type: 'String',
      required: true
    }
  ],
  code: `
  $jsonLoad[data;$getUserVar[userCollectibles;$env[user]]]
  $jsonLoad[uniques;$env[data;unique]]
  $return[$arrayIncludes[uniques;$env[collectibleID]]]
  `
});
