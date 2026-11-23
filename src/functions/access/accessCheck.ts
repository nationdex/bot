import { ForgeFunction } from '@tryforge/forgescript';
import { ownerOnlyCapabilities } from '../../config/access';
export default new ForgeFunction({
  name: 'accessCheck',
  // Decides whether the holder of a capability set may delegate another set: ok, owner_only or denied.
  params: [
    {
      name: 'held',
      // JSON array of the acting user capabilities
      type: 'String',
      required: true,
    },
    {
      name: 'needed',
      // JSON array of the capabilities being delegated
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[held;$env[held]]
  $jsonLoad[needed;$env[needed]]
  $arrayLoad[ownerOnly;,;${ownerOnlyCapabilities.join(',')}]
  $if[$and[$arraySome[ownerOnly;c;$accessMatch[$env[needed];$env[c]]];$arrayIncludes[held;*]==false];
    $return[owner_only]
  ]
  $if[$arrayEvery[needed;c;$accessMatch[$env[held];$env[c]]];
    $return[ok]
  ;
    $return[denied]
  ]
  `,
});
