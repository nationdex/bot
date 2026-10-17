import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'suggestionAccess',
  // Checks that a suggestion may be used for an action. Returns an errors.ts key, or nothing when allowed.
  params: [
    {
      name: 'id',
      // The suggestion id.
      type: 'String',
      required: true,
    },
    {
      name: 'user',
      // The acting user's ID.
      type: 'String',
      required: true,
    },
    {
      name: 'need',
      // exists, ownerOpen (submitter of an open suggestion), staffOpen (any open suggestion) or vote (pending and not own).
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[raw;$getSuggestion[$env[id]]]
  $let[user;$env[user]]
  $let[need;$env[need]]
  $return[$js[
    (() => {
      const kw = (k) => String(ctx.getKeyword(k) ?? '')
      const s = JSON.parse(kw('raw') || '{}')
      if (!s.id) return 'suggestion_not_found'
      const need = kw('need')
      const open = s.status === 'pending' || s.status === 'changes_requested'
      if (need === 'ownerOpen') {
        if (s.submitterId !== kw('user')) return 'suggestion_not_owner'
        if (!open) return 'suggestion_not_open'
      }
      if (need === 'staffOpen' && !open) return 'suggestion_not_pending'
      if (need === 'vote') {
        if (s.status !== 'pending') return 'suggestion_voting_closed'
        if (s.submitterId === kw('user')) return 'suggestion_self_vote'
      }
      return ''
    })()
  ]]
  `,
});
