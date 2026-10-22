import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'recountOwners',
  // Recounts the inventory of every user who owns a nation. Returns how many were recounted.
  params: [
    {
      name: 'nation',
      // The catalog nation id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[rows;$searchDB[userCollectibles]]
  $let[count;0]
  $arrayForEach[rows;row;
    $if[$js[(JSON.parse(ctx.getEnvironmentKey('row').value || 'null') || {}).unique?.map(String).includes(ctx.getEnvironmentKey('nation'))];
      $!recountUser[$env[row;id]]
      $letSum[count;1]
    ]
  ]
  $return[$get[count]]
  `,
});
