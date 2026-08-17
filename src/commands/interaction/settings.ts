import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  code: `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==settings]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[not_author;true]
  ]
  
  $let[key;$arrayAt[cid;1]]
  $let[value;$arrayAt[cid;3]]
  $jsonLoad[settings;$getUserVar[settings]]
  
  $!jsonSet[settings;$get[key];$get[value]]
  $setUserVar[settings;$env[settings]]
  
  $interactionUpdate[$settingsMenu[$authorID]]
  `,
});
