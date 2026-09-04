import { slashCommand } from '../../config/slash';

export default slashCommand('collectibles.last', `
  $let[user;$findUser[$option[user];true]]
  $jsonLoad[classes;$collectiblesData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_collect;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[inv_private;true]
    ]
  ]
  
  $jsonLoad[ctbls;$getUserData[$get[user];collectibleIDs]]
  $if[$get[class]!=;
    $arrayMap[ctbls;colID;$if[$collectibleInfo[$collectible[$env[colID];id];class]==$get[class];$return[$env[colID]]];ctbls]
  ]
  
  $onlyIf[$arrayLength[ctbls]>0;
    $err[no_collectibles_found;true]
  ]
  
  $let[id;$env[ctbls;$sub[$arrayLength[ctbls];1]]]
  
  $interactionReply[
**Info on the last $jsonVar[keywords;collectible.singular] caught**:
$collectibleCard[$get[id]]
  ]
`);
