import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionGrant',
  // Places an escrowed collectible into a user's inventory and makes them its owner.
  params: [
    {
      name: 'user',
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[user;$env[user]]
  $let[id;$env[id]]
  $let[colID;$collectible[$get[id];id]]
  $let[class;$collectibleInfo[$get[colID];class]]

  $let[invLock;$mutex[acquire;inv:$get[user]]]
  $jsonLoad[data;$getUserVar[userCollectibles;$get[user]]]
  $jsonLoad[userCollectibles;$env[data;collectibleIDs]]
  $jsonLoad[uniques;$env[data;unique]]
  $if[$arrayIncludes[userCollectibles;$get[id]];
    $!mutex[release;inv:$get[user];$get[invLock]]
    $return[false]
  ]
  $!jsonSet[data;collectibleIDs;$arrayLength[userCollectibles];"$get[id]"]
  $if[$arrayIncludes[uniques;$get[colID]]==false;
    $!jsonSet[data;unique;$arrayLength[uniques];$get[colID]]
  ]
  $!jsonSet[data;total;$sum[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sum[$default[$env[data;$get[class]];0];1]]
  $!jsonSet[data;total_value;$sum[$env[data;total_value];$collectibleInfo[$get[colID];weight]]]
  $setUserVar[userCollectibles;$env[data];$get[user]]

  $jsonLoad[record;$getVar[collectible;$get[id]]]
  $!jsonSet[record;author;"$get[user]"]
  $setVar[collectible;$get[id];$env[record]]
  $!mutex[release;inv:$get[user];$get[invLock]]
  $return[true]
  `,
});
