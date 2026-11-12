import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessNotify',
  // Direct messages every owner so a takeover or escalation is visible.
  params: [
    {
      name: 'text',
      // The message to send
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[owners;$accessOwners]
  $arrayForEach[owners;owner;
    $try[$!sendDM[$env[owner];$env[text]];]
  ]
  `,
});
