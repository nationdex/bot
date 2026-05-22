import { ForgeFunction } from "@tryforge/forgescript"

export default new ForgeFunction({
  name: "userSettings",
  // Get an user's settings from the "settings" variable
  params: [
    {
      "name": "user",
      // The user whose setting to get
      "type": "String",
      "required": true
    },
    {
      "name": "value",
      // The value to retrive
      "type": "String",
      "required": true
    }
  ],
  code: `
  $jsonLoad[data;$getUserVar[settings;$env[user]]]
  $return[$env[data;$env[value]]]
  `
});