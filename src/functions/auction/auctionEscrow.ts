import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionEscrow',
  // Removes a caught collectible from a user's inventory so it can sit in the auction house.
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
  $if[$arrayIncludes[userCollectibles;$get[id]]==false;
    $!mutex[release;inv:$get[user];$get[invLock]]
    $return[false]
  ]
  $!jsonDelete[userCollectibles;$arrayIndexOf[userCollectibles;$get[id]]]
  $!jsonSet[data;collectibleIDs;$env[userCollectibles]]
  $arrayMap[userCollectibles;nat;$return[$collectible[$env[nat];id]];nids]
  $if[$arraySome[nids;n;$env[n]==$get[colID]]==false;
    $arrayFilter[uniques;u;$env[u]!=$get[colID];uniques]
    $!jsonSet[data;unique;$env[uniques]]
  ]
  $!jsonSet[data;total;$max[$sub[$env[data;total];1];0]]
  $!jsonSet[data;$get[class];$max[$sub[$env[data;$get[class]];1];0]]
  $!jsonSet[data;total_value;$max[$sub[$env[data;total_value];$collectibleInfo[$get[colID];weight]];0]]
  $setUserVar[userCollectibles;$env[data];$get[user]]
  $!mutex[release;inv:$get[user];$get[invLock]]
  $return[true]
  `,
});
