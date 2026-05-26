import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'addUserNation',
  // Add a nation to a user's completion.
  params: [
    {
      name: 'user',
      // The ID of the user.
      type: 'String',
      required: true,
    },
    {
      name: 'nation',
      // The id of the nation to add.
      type: 'String',
      required: true,
    },
    {
      name: 'data',
      // The nation's data.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[user;$env[user]]
  $let[nation;$env[nation]]
  $let[data;$env[data]]
  $let[id;$js[Array.from(require('crypto').randomBytes(7),b=>'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[b%36\\]).join('')]]
  
  $jsonLoad[userData;$getUserVar[nations;$get[user]]]
  $jsonLoad[unique;$env[userData;unique]]
  $jsonLoad[nations;$env[userData;nations]]
  $!jsonSet[userData;nations;$arrayLength[nations];$get[id]]
  $!jsonSet[userData;$getNationInfo[$get[nation];class];$sum[$env[userData;$getNationInfo[$get[nation];class]];1]]
  $!jsonSet[userData;total;$sum[$env[userData;total];1]]
  $!jsonSet[userData;total_value;$sum[$env[userData;total_value];$getNationInfo[$get[nation];weight]]]
  $if[$arrayIncludes[unique;$get[nation]]==false;
    $!jsonSet[userData;unique;$arrayLength[unique];$get[nation]]
  ]
  $setUserVar[nations;$env[userData]]
  $setVar[nation;$get[id];$env[data]]
  
  $jsonLoad[data;$getGlobalVar[nationsData]]
  $!jsonSet[data;total_caught;$sum[$env[data;total_caught];1]]
  $!jsonSet[data;nations;$get[nation];global_caught;$sum[$env[data;nations;$get[nation];global_caught];1]]
  $setGlobalVar[nationsData;$env[data]]
  `,
});
