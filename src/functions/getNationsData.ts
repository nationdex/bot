import { ForgeFunction } from "@tryforge/forgescript"

export default new ForgeFunction({
  name: "getNationsData",
  // Get info about nations from the "nationsData" variable
  params: [
    {
      "name": "value",
      // The value/info to retrive, leave blank to get json data
      "type": "String",
      "required": false
    },
    {
      "name": "separator",
      // The separator to use in case of multiple values
      "type": "String",
      "required": false
    }
  ],
  code: `
  $jsonLoad[data;$getGlobalVar[nationsData]]
  $jsonLoad[keys;$jsonKeys[data]]
  $let[value;$env[value]]
  $let[separator;$env[separator]]
  
  $if[$env[value]==null;
    $return[$env[data]]
  ]
  
  $if[$arrayIncludes[keys;$get[value]];
    $return[$env[data;$get[value]]];
    $jsonLoad[nations;$env[data;nations]]
    $jsonLoad[ids;$jsonKeys[nations]]
    $arrayMap[ids;id;$return[$env[nations;$env[id];$get[value]]];mapped]
    $if[$get[separator]==null;
      $return[$env[mapped]];
      $return[$arrayJoin[mapped;$get[separator]]]
    ]
  ]
`
});