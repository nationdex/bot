import { config } from "../../config/config"
import { ApplicationCommand } from "@tryforge/forgescript"
import { ApplicationCommandType, ApplicationIntegrationType } from "discord.js"

export default new ApplicationCommand({
  data: {
  type: ApplicationCommandType.ChatInput,
  name: "commands",
  description: "Get a list of commands",
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  ]
  },
  independent: true,
  code: `
  $jsonLoad[commands;$applicationCommands]
  $jsonLoad[miscs;[\\]]
  $arrayMap[commands;cmd;$let[id;$env[cmd;id]]
  $let[name;$env[cmd;name]]
  $jsonLoad[options;$env[cmd;options]]
  $arrayMap[options;opt;$if[$env[opt;type]==1;$return[</$get[name] $env[opt;name]:$get[id]>: $env[opt;description]]];option]
  $if[$arrayLength[option]>0;
  $let[total;$sum[$get[total];$arrayLength[option]]]
  $return[### $toTitleCase[$get[name]] ($arrayLength[option])
$arrayJoin[option;
]];$!jsonSet[miscs;$arrayLength[miscs];</$get[name]:$get[id]>: $env[cmd;description]]];command]
  
  $interactionReply[
    $addContainer[
      $addSection[
        $addTextDisplay[## ${config.name} Commands
-# $applicationCommandCount commands
-# $get[total] subcommands]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addSeparator
      $addTextDisplay[$if[$arrayLength[commands]>0;$arrayJoin[command;
]]
$if[$arrayLength[miscs]>0;### Miscellaneous ($arrayLength[miscs])
$arrayJoin[miscs;
]]
]
      $addSeparator
      $addTextDisplay[-# Made with ❤️ by NationDex Team™]
    ;${config.color}]
  ]
  `
});