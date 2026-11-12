import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistCount',
  // Returns the number of blacklisted users or servers.
  params: [
    {
      name: 'type',
      // user or guild
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[rows;$searchDB[blacklist]]
  $let[count;0]
  $arrayForEach[rows;row;
    $if[$env[row;type]==$env[type];
      $jsonLoad[entry;$default[$env[row;value];{}]]
      $if[$default[$env[entry;timestamp];0]>0;$let[count;$sum[$get[count];1]]]
    ]
  ]
  $return[$get[count]]
  `,
});
