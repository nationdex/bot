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
  $return[$js[
    const held = JSON.parse(ctx.getEnvironmentKey('caps') || 'null') || new Array();
    const cap = String(ctx.getEnvironmentKey('cap') || '');
    held.some((h) => h === '*' || h === cap || (h.endsWith('.*') && cap.startsWith(h.slice(0, -1))))
  ]]
  `,
});
