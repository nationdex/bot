import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'addUserCollectible',
  // Add a collectible to a user's completion.
  params: [
    {
      name: 'user',
      // The ID of the user.
      type: 'String',
      required: true,
    },
    {
      name: 'collectibleID',
      // The ID of the collectible to add.
      type: 'String',
      required: true,
    },
    {
      name: 'data',
      // The collectible's data.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[user;$env[user]]
  $let[ctbl;$env[collectibleID]]
  $let[data;$env[data]]
  $let[id;$js[Array.from(require('crypto').randomBytes(7),b=>'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[b%36\\]).join('')]]
  
  $jsonLoad[userData;$getUserVar[userCollectibles;$get[user]]]
  $jsonLoad[unique;$env[userData;unique]]
  $jsonLoad[userCollectibles;$env[userData;collectibleIds]]
  $!jsonSet[userData;collectibleIds;$arrayLength[userCollectibles];$get[id]]
  $!jsonSet[userData;$collectibleInfo[$get[ctbl];class];$sum[$env[userData;$collectibleInfo[$get[ctbl];class]];1]]
  $!jsonSet[userData;total;$sum[$env[userData;total];1]]
  $!jsonSet[userData;total_value;$sum[$env[userData;total_value];$collectibleInfo[$get[ctbl];weight]]]
  $if[$arrayIncludes[unique;$get[ctbl]]==false;
    $!jsonSet[userData;unique;$arrayLength[unique];$get[ctbl]]
  ]
  $setUserVar[userCollectibles;$env[userData]]
  $setVar[collectible;$get[id];$env[data]]
  
  $jsonLoad[data;$getGlobalVar[collectiblesData]]
  $!jsonSet[data;total_caught;$sum[$env[data;total_caught];1]]
  $!jsonSet[data;userCollectibles;$get[ctbl];global_caught;$sum[$env[data;collectibles;$get[ctbl];global_caught];1]]
  $setGlobalVar[collectiblesData;$env[data]]
  `,
});
