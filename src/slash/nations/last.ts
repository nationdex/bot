import { ApplicationCommand } from "@tryforge/forgescript"
import { ApplicationCommandType, ApplicationCommandOptionType, ApplicationIntegrationType } from "discord.js"

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: "last",
    description: "View info of the last nation you caught",
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "The user whose last nation to check",
        required: false
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "class",
        description: "View info of the last nation you caught of a specific rarity class",
        required: false,
        choices: [
          {
            "name": "Common",
            "value": "common"
          },
          {
            "name": "Uncommon",
            "value": "uncommon"
          },
          {
            "name": "Rare",
            "value": "rare"
          },
          {
            "name": "Mythic",
            "value": "mythic"
          },
          {
            "name": "Legendary",
            "value": "legendary"
          }
        ]
      }
    ]
  },
  code: `
  $let[user;$findUser[$option[user];true]]
  $let[class;$option[class]]
  $jsonLoad[blocked;$getUserVar[blockedUsers;$get[user]]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot collect nations, sadly :(;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[<@$get[user]> have their inventory private;true]
    ]
  ]
  $onlyIf[$arrayIncludes[blocked;$authorID]==false;
    $err[Something went wrong;true]
  ]
  
  $jsonLoad[nations;$getUserData[$get[user];nations]]
  $if[$get[class]!=;
    $arrayMap[nations;nation;$if[$getNationInfo[$getNation[$env[nation];nation];class]==$get[class];$return[$env[nation]]];nations]
  ]
  
  $onlyIf[$arrayLength[nations]>0;
    $err[No nations found;true]
  ]
  
  $let[id;$env[nations;$sub[$arrayLength[nations];1]]]
  
  $interactionReply[
**Info of the last nation you caught**:
$nationCard[$get[id]]
  ]
  `
});