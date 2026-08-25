import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  hide: true,
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$and[$arrayAt[cid;0]==collectibles;$arrayAt[cid;1]==info]]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[not_author;true]
  ]
  
  $let[id;$default[$selectMenuValues[0];$arrayAt[cid;3]]]
  
  $interactionReply[Loading $jsonVar[keywords;collectible.singular] info...]
  
  $interactionUpdate[
    $collectibleCard[$get[id]]
  ]
  `,
});
