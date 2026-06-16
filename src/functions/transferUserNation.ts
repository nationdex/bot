import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'transferUserNation',
  // Add a nation to a user's completion
  params: [
    {
      name: 'reciever',
      // The ID of the user whom to give
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The ID of the nation that to transfer
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[reciever;$env[reciever]]
  $let[id;$env[id]]
  $let[author;$getNation[$get[id];author]]
  $let[nation;$getNation[$get[id];nation]]
  $let[class;$getNationInfo[$get[nation];class]]
  
  $jsonLoad[data;$getUserVar[nations;$get[author]]]
  $jsonLoad[nations;$env[data;nations]]
  $jsonLoad[uniques;$env[data;unique]]
  $!jsonDelete[nations;$arrayIndexOf[nations;$get[id]]]
  $!jsonSet[data;nations;$env[nations]]
  $arrayMap[nations;nat;$return[$getNation[$env[nat];nation]];nids]
  $if[$arrayIncludes[nids;$get[nation]]==false;
    $!jsonDelete[data;unique;$arrayIndexOf[uniques;$get[nation]]]
  ]
  $!jsonSet[data;total;$sub[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sub[$env[data;$get[class]];1]]
  $!jsonSet[data;total_value;$max[$sub[$env[data;total_value];$getNationInfo[$get[nation];weight]];0]]
  $setUserVar[nations;$env[data];$get[author]]
  
  $jsonLoad[data;$getUserVar[nations;$get[reciever]]]
  $jsonLoad[nations;$env[data;nations]]
  $jsonLoad[uniques;$env[data;unique]]
  $!jsonSet[data;nations;$arrayLength[nations];$get[id]]
  $if[$arrayIncludes[uniques;$get[nation]]==false;
    $!jsonSet[data;unique;$arrayLength[uniques];$get[nation]]
  ]
  $!jsonSet[data;total;$sum[$env[data;total];1]]
  $!jsonSet[data;$get[class];$sum[$env[data;$get[class]];1]]
  $!jsonSet[data;total_value;$sum[$env[data;total_value];$getNationInfo[$get[nation];weight]]]
  $setUserVar[nations;$env[data];$get[reciever]]
  
  $jsonLoad[data;$getVar[nation;$get[id]]]
  $!jsonSet[data;author;"$get[reciever]"]
  $setVar[nation;$get[id];$env[data]]
  `,
});
