import { ForgeFunction } from "@tryforge/forgescript"

export default new ForgeFunction({
  name: "getEvent",
  // Get information about an event from the "events" variable
  params: [
    {
      "name": "name",
      // name of the event
      "type": "String",
      "required": true
    },
    {
      "name": "value",
      // value or info go retrive
      "type": "String",
      "required": false
    }
  ],
  code: `
  $let[ev;$env[name]]
  $let[val;$env[value]]
  
  $jsonLoad[events;$getGlobalVar[events]]
  $jsonLoad[event;$env[events;$get[ev]]]
  
  $return[$if[$get[val]!=;$env[event;$get[val]];$env[event]]]
  `
});