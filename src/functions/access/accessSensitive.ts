import { ForgeFunction } from '@tryforge/forgescript';
import { sensitiveCapabilities } from '../../config/access';
export default new ForgeFunction({
  name: 'accessSensitive',
  // Returns true when any capability in a JSON array is sensitive enough to notify the owners.
  params: [
    {
      name: 'caps',
      // JSON array of capabilities
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[caps;$env[caps]]
  $arrayLoad[sens;,;${sensitiveCapabilities.join(',')}]
  $return[$arraySome[caps;cap;$arrayIncludes[sens;$env[cap]]]]
  `,
});
