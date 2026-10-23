import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'transferUserCollectible',
  // Transfer a collectible from one user to another
  params: [
    {
      name: 'receiver',
      // The ID of the user receiving the collectible
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
  $let[receiver;$env[receiver]]
  $let[id;$env[id]]
  $let[author;$collectible[$get[id];author]]
  $let[colID;$collectible[$get[id];id]]
  $let[class;$collectibleInfo[$get[colID];class]]
  
  $let[first;$js[Array.of(ctx.getKeyword('author'), ctx.getKeyword('receiver')).sort().at(0)]]
  $let[second;$js[Array.of(ctx.getKeyword('author'), ctx.getKeyword('receiver')).sort().at(1)]]
  $let[lockOne;$mutex[acquire;inv:$get[first]]]
  $let[lockTwo;$if[$get[second]!=$get[first];$mutex[acquire;inv:$get[second]];]]
  $jsonLoad[data;$getUserVar[userCollectibles;$get[author]]]
  $jsonLoad[userCollectibles;$env[data;collectibleIDs]]
  $jsonLoad[uniques;$env[data;unique]]
  $!jsonDelete[userCollectibles;$arrayIndexOf[userCollectibles;$get[id]]]
  $!jsonSet[data;collectibleIDs;$env[userCollectibles]]
  $arrayMap[userCollectibles;nat;$return[$collectible[$env[nat];id]];nids]
  $if[$arrayIndexOf[nids;$get[colID]]==-1;
    $!jsonDelete[data;unique;$arrayIndexOf[uniques;$get[colID]]]
  ]
  $!jsonSet[data;total;$sub[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sub[$env[data;$get[class]];1]]
  $!jsonSet[data;total_value;$max[$sub[$env[data;total_value];$collectibleInfo[$get[colID];weight]];0]]
  $setUserVar[userCollectibles;$env[data];$get[author]]
  
  $jsonLoad[data;$getUserVar[userCollectibles;$get[receiver]]]
  $jsonLoad[userCollectibles;$env[data;collectibleIDs]]
  $jsonLoad[uniques;$env[data;unique]]
  $!jsonSet[data;collectibleIDs;$arrayLength[userCollectibles];$get[id]]
  $if[$arrayIncludes[uniques;$get[colID]]==false;
    $!jsonSet[data;unique;$arrayLength[uniques];$get[colID]]
  ]
  $!jsonSet[data;total;$sum[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sum[$env[data;$get[class]];1]]
  $!jsonSet[data;total_value;$sum[$env[data;total_value];$collectibleInfo[$get[colID];weight]]]
  $setUserVar[userCollectibles;$env[data];$get[receiver]]
  
  $jsonLoad[data;$getVar[collectible;$get[id]]]
  $!jsonSet[data;author;"$get[receiver]"]
  $setVar[collectible;$get[id];$env[data]]
  $!mutex[release;inv:$get[first];$get[lockOne]]
  $if[$get[second]!=$get[first];$!mutex[release;inv:$get[second];$get[lockTwo]]]
  `,
});
