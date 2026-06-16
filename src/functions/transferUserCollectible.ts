import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'transferUserCollectible',
  // Transfer a collectible from one user to another
  params: [
    {
      name: 'reciever',
      // The ID of the user whom to give
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The ID of the collectible to transfer
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[reciever;$env[reciever]]
  $let[id;$env[id]]
  $let[author;$collectible[$get[id];author]]
  $let[colId;$collectible[$get[id];collectible]]
  $let[class;$collectibleInfo[$get[colId];class]]
  
  $jsonLoad[data;$getUserVar[userCollectibles;$get[author]]]
  $jsonLoad[userCollectibles;$env[data;collectibleIds]]
  $jsonLoad[uniques;$env[data;unique]]
  $!jsonDelete[userCollectibles;$arrayIndexOf[userCollectibles;$get[id]]]
  $!jsonSet[data;collectibleIds;$env[userCollectibles]]
  $arrayMap[userCollectibles;nat;$return[$collectible[$env[nat];collectible]];nids]
  $if[$arrayIncludes[nids;$get[colId]]==false;
    $!jsonDelete[data;unique;$arrayIndexOf[uniques;$get[colId]]]
  ]
  $!jsonSet[data;total;$sub[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sub[$env[data;$get[class]];1]]
  $!jsonSet[data;total_value;$max[$sub[$env[data;total_value];$collectibleInfo[$get[colId];weight]];0]]
  $setUserVar[userCollectibles;$env[data];$get[author]]
  
  $jsonLoad[data;$getUserVar[userCollectibles;$get[reciever]]]
  $jsonLoad[userCollectibles;$env[data;collectibleIds]]
  $jsonLoad[uniques;$env[data;unique]]
  $!jsonSet[data;collectibleIds;$arrayLength[userCollectibles];$get[id]]
  $if[$arrayIncludes[uniques;$get[colId]]==false;
    $!jsonSet[data;unique;$arrayLength[uniques];$get[colId]]
  ]
  $!jsonSet[data;total;$sum[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sum[$env[data;$get[class]];1]]
  $!jsonSet[data;total_value;$sum[$env[data;total_value];$collectibleInfo[$get[colId];weight]]]
  $setUserVar[userCollectibles;$env[data];$get[reciever]]
  
  $jsonLoad[data;$getVar[collectible;$get[id]]]
  $!jsonSet[data;author;"$get[reciever]"]
  $setVar[collectible;$get[id];$env[data]]
  `,
});
