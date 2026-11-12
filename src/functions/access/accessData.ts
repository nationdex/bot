import { ForgeFunction } from '@tryforge/forgescript';
import { baseAccessRoles } from '../../config/variables';

export default new ForgeFunction({
  name: 'accessData',
  // The stored access data (roles, API tokens, eval channel) with the default roles filled in: every default role that staff did not delete or change is present, and owner is always * . Returns JSON.
  params: [],
  code: `
  $let[raw;$getGlobalVar[access]]
  $return[$js[
    const stored = JSON.parse(ctx.getKeyword('raw') || 'null') || {};
    const defaults = {};
    '${Object.entries(baseAccessRoles).map(([name, caps]) => name + '=' + caps.join(',')).join('|')}'.split('|').forEach((entry) => Reflect.set(defaults, entry.split('=').at(0), entry.split('=').at(1).split(',')));
    const removed = Array.isArray(stored.removedRoles) ? stored.removedRoles : new Array();
    const roles = Object.assign({}, stored.roles || {});
    Object.keys(defaults).forEach((name) => {
      if (!Object.prototype.hasOwnProperty.call(roles, name) && !removed.includes(name)) Reflect.set(roles, name, Reflect.get(defaults, name));
    });
    Reflect.set(roles, 'owner', new Array('*'));
    stored.roles = roles;
    stored.removedRoles = removed;
    stored.tokens = stored.tokens || {};
    stored.evalChannel = stored.evalChannel || '';
    JSON.stringify(stored)
  ]]
  `,
});
