import { command } from '../../core/define/commands';

export default command('interaction.settings', `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==settings]
  $onlyIf[$arrayAt[cid;2]==$authorID;
    $err[not_author;true]
  ]
  
  $let[key;$arrayAt[cid;1]]
  $let[value;$arrayAt[cid;3]]
  $let[lock;$mutex[acquire;user:$authorID]]
  $jsonLoad[settings;$getUserVar[settings]]
  
  $!jsonSet[settings;$get[key];$get[value]]
  $setUserVar[settings;$env[settings]]
  $!mutex[release;user:$authorID;$get[lock]]
  
  $interactionUpdate[$settingsMenu[$authorID]]
`);
