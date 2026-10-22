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
  $return[$js[
    const held = JSON.parse(ctx.getEnvironmentKey('held') || 'null') || new Array();
    const needed = JSON.parse(ctx.getEnvironmentKey('needed') || 'null') || new Array();
    const ownerOnly = '${ownerOnlyCapabilities.join(',')}'.split(',');
    const has = (cap) => held.some((h) => h === '*' || h === cap || (!cap.endsWith('.*') && h.endsWith('.*') && cap.startsWith(h.slice(0, -1))));
    if (needed.some((c) => ownerOnly.includes(c)) && !held.includes('*')) 'owner_only';
    else if (needed.every((c) => has(c))) 'ok';
    else 'denied';
  ]]
  `,
});
