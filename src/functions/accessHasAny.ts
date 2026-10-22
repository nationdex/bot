import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessHasAny',
  // Returns whether a user holds at least one active access grant (staff).
  params: [
    {
      name: 'user',
      // The user id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[caps;$accessCaps[$env[user]]]
  $return[$js[ctx.getEnvironmentKey('caps').length > 0]]
  `,
});
