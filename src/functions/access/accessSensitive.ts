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
  $return[$js[
    const caps = JSON.parse(ctx.getEnvironmentKey('caps') || 'null') || new Array();
    const sensitive = '${sensitiveCapabilities.join(',')}'.split(',');
    caps.some((c) => sensitive.includes(c))
  ]]
  `,
});
