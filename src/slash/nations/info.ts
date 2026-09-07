import { SlashCommand } from '../../util/slashes';

export default SlashCommand('collectibles.info', `
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]
  $let[id;$default[$option[$jsonVar[keywords;collectible.singular]];$env[collectibles;0]]]
  $let[ind;$arrayIndexOf[collectibles;$get[id]]]
  $let[prev;$env[collectibles;$sub[$get[ind];1]]]
  $let[next;$env[collectibles;$sum[$get[ind];1]]]
  
  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[invalid_collectible;true]
  ]
  $onlyIf[$arrayLength[collectibles]>0;
    $err[no_collectibles_found;true]
  ]

  $interactionReply[Loading $jsonVar[keywords;collectible.singular] info...]
  
  $let[prevEmoji;$appEmoji[arrow_left]]
  $let[nextEmoji;$appEmoji[arrow_right]]

  $interactionUpdate[
    $collectibleCard[$get[id]]
    $addActionRow
    $addButton[pages-collectibleInfo-$authorID-$get[prev]-prev;$if[$get[prevEmoji]==;Previous];Secondary;$get[prevEmoji];$if[$get[prev]==;true]]
    $addButton[pages-collectibleInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[collectibles];Primary;;true]
    $addButton[pages-collectibleInfo-$authorID-$get[next]-next;$if[$get[nextEmoji]==;Next];Secondary;$get[nextEmoji];$if[$get[next]==;true]]
  ]
`);
