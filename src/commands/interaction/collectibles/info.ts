import { BaseCommand } from '@tryforge/forgescript';
import { ctbl } from '../../../config/collectible';

export default new BaseCommand({
  hide: true,
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$and[$arrayAt[cid;0]==collectibles;$arrayAt[cid;1]==info]]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[You cannot use this!;true]
  ]
  
  $let[id;$default[$selectMenuValues[0];$arrayAt[cid;3]]]
  
  $interactionReply[Loading ${ctbl.singular} info...]
  
  $interactionUpdate[
    $collectibleCard[$get[id]]
  ]
  `,
});
