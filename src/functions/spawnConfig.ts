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
  ],
  code: `
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $return[$env[config;$env[value]]]
  `,
});
