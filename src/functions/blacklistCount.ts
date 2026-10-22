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
  $return[$js[ctx.getEnvironmentKey('rows').filter((r) => r.type === ctx.getEnvironmentKey('type') && Number((JSON.parse(r.value || 'null') || {}).timestamp) > 0).length]]
  `,
});
