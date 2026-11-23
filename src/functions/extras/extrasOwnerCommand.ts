import { ArgType, NativeFunction } from '@tryforge/forgescript';
import { extrasOperation } from '../../core/extras';

export default new NativeFunction({
  name: '$extrasOwnerCommand', description: 'Owner-only prefix interface to approved extras management.',
  output: ArgType.String, brackets: true, unwrap: true,
  args: [
    { name: 'operation', description: 'install, remove, update, edit, or list', type: ArgType.String, required: true, rest: false },
    { name: 'arguments', description: 'Extra ID and optional full commit SHA', type: ArgType.String, required: false, rest: false },
  ],
  async execute(ctx, [operation, input]) {
    const app = ctx.client.application;
    if (!app.owner) await app.fetch().catch(() => undefined);
    const owner = app.owner;
    const ownerId = owner && ('ownerId' in owner ? owner.ownerId : owner.id);
    if (!ownerId || ctx.user?.id !== ownerId) return this.success('Only the bot owner can manage extras.');
    const op = String(operation);
    const args = String(input ?? '').trim().split(/\s+/).filter(Boolean);
    if (!['install', 'remove', 'update', 'edit', 'list'].includes(op)) return this.success('Unknown extras operation.');
    const needed = op === 'list' ? 0 : op === 'remove' ? 1 : 2;
    if (args.length !== needed) return this.success('Usage: extras' + op + (needed ? ' <id>' : '') + (needed === 2 ? ' <full commit SHA>' : ''));
    const [id, ref] = args;
    if (needed && !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) return this.success('Invalid extra ID.');
    if (needed === 2 && !/^[a-f0-9]{40}$/.test(ref)) return this.success('Use a full lowercase 40-character commit SHA.');
    if (op === 'update' || op === 'edit') {
      const current = await extrasOperation('list', '', 'owner-command');
      if (current.status !== 200) return this.success(String(current.error));
      if (!(current.extras as Array<{ id: string }>).some(extra => extra.id === id)) return this.success('That extra is not installed.');
    }
    const result = await extrasOperation(op === 'update' || op === 'edit' ? 'install' : op, JSON.stringify({ id, ref }), 'owner-command');
    if (result.status !== 200) return this.success(String(result.error ?? 'Extras operation failed.'));
    if (op === 'list') {
      const items = result.extras as Array<{ id: string; ref: string; enabled: boolean }>;
      return this.success(items.length ? items.map(e => e.id + ' · ' + e.ref.slice(0, 12) + (e.enabled ? '' : ' · removal pending')).join('\n').slice(0, 1800) : 'No extras installed.');
    }
    return this.success('Extras ' + op + ' saved for ' + id + '. Restart the bot to apply the change.');
  },
});
