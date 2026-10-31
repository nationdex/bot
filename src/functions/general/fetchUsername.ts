import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'fetchUsername',
  // Returns the account username (never the display name) of any user id, fetching it from Discord when uncached.
  params: [
    {
      name: 'id',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$if[$env[id]!=null;$trim[$env[id]];]]
  $if[$get[id]==;$return[unknown]]
  $return[$default[$username[$get[id]];unknown]]
  `,
});
