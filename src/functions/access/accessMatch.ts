import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessMatch',
  // Returns true when a JSON array of held capabilities grants a capability (exact, namespace wildcard or *).
  params: [
    {
      name: 'caps',
      // JSON array of held capabilities
      type: 'String',
      required: true,
    },
    {
      name: 'cap',
      // The capability to test
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[caps;$env[caps]]
  $let[cap;$env[cap]]
  $return[$arraySome[caps;h;$or[$env[h]==*;$env[h]==$get[cap];$and[$endsWith[$env[h];.*];$startsWith[$get[cap];$cropText[$env[h];0;$sub[$charCount[$env[h]];1]]]]]]]
  `,
});
