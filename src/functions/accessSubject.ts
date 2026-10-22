import { ForgeFunction } from '@tryforge/forgescript';
import { accessCapabilities } from '../config/access';
export default new ForgeFunction({
  name: 'accessSubject',
  // Resolves a role or capability name to {"kind","caps"}, or empty when unknown.
  params: [
    {
      name: 'subject',
      // A role name or a capability
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[acc;$getGlobalVar[access]]
  $return[$js[
    const acc = JSON.parse(ctx.getKeyword('acc') || 'null') || {};
    const subject = String(ctx.getEnvironmentKey('subject') || '').trim();
    const known = '${accessCapabilities.join(',')}'.split(',');
    const role = Reflect.get(acc.roles || {}, subject);
    if (role) JSON.stringify({ kind: 'role', caps: role });
    else if (subject === '*' || known.includes(subject) || (subject.endsWith('.*') && known.some((c) => c.startsWith(subject.slice(0, -1))))) JSON.stringify({ kind: 'capability', caps: new Array(subject) });
    else '';
  ]]
  `,
});
