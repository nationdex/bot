import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectibleInfo',
  /// Get info about a specific collectible from the "collectiblesData" variable's "collectibles" key.
  params: [
    {
      name: 'id',
      // The collectible id whose info to get.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value/info to retrieve, leave blank to get json data.
      type: 'String',
      required: false,
    },
    {
      name: 'separator',
      // The separator to use in case of multiple values.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[value;$env[value]]
  $let[sep;$env[separator]]
  $jsonLoad[data;$getGlobalVar[collectiblesData]]
  $jsonLoad[colID;$env[data;collectibles;$get[id]]]
  
  $if[$get[value]!=null;
    $let[val;$env[colID;$get[value]]]
    $if[$and[$get[sep]!=null;$isArray[$get[val]]];
      $jsonLoad[values;$get[val]]
      $return[$arrayJoin[values;$get[sep]]]
    ]
    $return[$get[val]]
  ]

  $return[$env[colID]]
  `,
});
