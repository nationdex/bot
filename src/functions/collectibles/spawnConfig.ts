import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'spawnConfig',
  // Get a server's spawn configuration from the "spawnConfig" variable.
  params: [
    {
      name: 'value',
      // The value to get.
      type: 'String',
      required: true,
    },
    {
      name: 'guild',
      // The guild ID to get the spawn config for, defaults to the current guild.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $if[$env[guild]!=null;
    $jsonLoad[config;$getGuildVar[spawnConfig;$env[guild]]]
  ;
    $jsonLoad[config;$getGuildVar[spawnConfig]]
  ]
  $return[$env[config;$env[value]]]
  `,
});
