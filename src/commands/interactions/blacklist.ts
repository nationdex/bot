import { command } from '../../core/define/commands';

export default command('interaction.blacklist', `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==blacklist]
  $onlyIf[$hasCap[$authorID;blacklist.read];$err[not_bot_staff;true]]
  $onlyIf[$arrayAt[cid;2]==$authorID;$err[not_author;true]]

  $let[act;$arrayAt[cid;1]]
  $let[type;$arrayAt[cid;3]]

  $ifx[
    $if[$get[act]==type;
      $interactionUpdate[$blacklistPanel[$selectMenuValues[0];1;$authorID]]
    ]
    $elseIf[$or[$get[act]==page;$get[act]==back];
      $interactionUpdate[$blacklistPanel[$get[type];$arrayAt[cid;4];$authorID]]
    ]
    $elseIf[$get[act]==pick;
      $interactionUpdate[$blacklistDetailView[$get[type];$selectMenuValues[0];$authorID;$arrayAt[cid;4]]]
    ]
    $elseIf[$get[act]==remove;
      $onlyIf[$hasCap[$authorID;blacklist.write];$err[not_bot_staff;true]]
      $!blacklistRemove[$get[type];$arrayAt[cid;4];$authorID;removed via panel]
      $interactionUpdate[$blacklistDetailView[$get[type];$arrayAt[cid;4];$authorID;$arrayAt[cid;5]]]
    ]
  ]
`);
