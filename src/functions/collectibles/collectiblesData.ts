import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectiblesData',
  // Get info about collectibles from the "collectiblesData" variable.
  params: [
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
  $jsonLoad[data;$getGlobalVar[collectiblesData]]
  $jsonLoad[keys;$jsonKeys[data]]
  $let[value;$env[value]]
  $let[separator;$env[separator]]

  $if[$env[value]==null;
    $return[$env[data]]
  ]

  $if[$arrayIncludes[keys;$get[value]];
    $return[$env[data;$get[value]]];
    $jsonLoad[collectibles;$env[data;collectibles]]
    $jsonLoad[ids;$jsonKeys[collectibles]]
    $arrayMap[ids;id;$return[$env[collectibles;$env[id];$get[value]]];mapped]
    $if[$get[separator]==null;
      $return[$env[mapped]];
      $return[$arrayJoin[mapped;$get[separator]]]
    ]
  ]
`,
});
