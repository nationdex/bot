import { SlashCommand } from '../../core/slashes';

export default SlashCommand('collectibles.progress', `
  $let[user;$findUser[$option[user];true]]
  $let[class;$option[class]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_collect;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[inv_private;true]
    ]
  ]
  
  $interactionReply[
    $addTextDisplay[Fetching $jsonVar[keywords;collectible.plural] data for **$userDisplayName[$get[user]]**...]
  ]
  
  $interactionUpdate[
    $progressMenu[$get[user];$get[class];1]
  ]
`);
