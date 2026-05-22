import { ApplicationCommand } from "@tryforge/forgescript"
import { ApplicationCommandType, ApplicationIntegrationType } from "discord.js"

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: "settings",
    description: "View or customise your player settings",
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall
    ]
  },
  code: `
  $jsonLoad[settings;$getUserVar[settings]]
  
  $interactionReply[
    $ephemeral
    $addTextDisplay[Fetching your player settings...]
  ]
  
  $interactionUpdate[$settingsMenu[$authorID]]
  `
});