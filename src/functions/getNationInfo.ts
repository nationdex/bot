import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'getNationInfo',
  // Get info about a specific nation from the "nationsData" variable's "nations" key.
  params: [
    {
      name: 'id',
      // The nation id whose info to get.
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
  $jsonLoad[data;$getGlobalVar[nationsData]]
  $jsonLoad[nation;$env[data;nations;$get[id]]]
  
  $if[$get[value]!=null;
    $if[$isJSON[$env[nation;$get[value]]];
      $jsonLoad[values;$env[nation;$env[value]]]
      $if[$get[sep]!=null;
        $return[$arrayJoin[values;$get[sep]]]
        ;$return[$env[values]]
      ]
      ;$return[$env[nation;$get[value]]]
    ]
    ;$return[$env[nation]]
  ]
  `,
});
