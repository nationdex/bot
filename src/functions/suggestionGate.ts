import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionLimits } from '../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionGate',
  // Checks a user's open-suggestion limit and submit cooldown. Returns an error key, or nothing when allowed.
  params: [
    {
      name: 'user',
      // The submitter's user ID.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[all;$listSuggestions[]]
  $return[$js[
    (() => {
      const user = String(ctx.getEnvironmentKey('user'))
      const all = JSON.parse(String(ctx.getKeyword('all') || 'null')) || new Array()
      const mine = all.filter((s) => s.submitterId === user)
      const open = mine.filter((s) => s.status === 'pending' || s.status === 'changes_requested')
      if (open.length >= ${suggestionLimits.maxOpenPerUser}) return 'suggestion_limit'
      const last = mine.reduce((max, s) => Math.max(max, new Date(s.createdAt).getTime() || 0), 0)
      if (Date.now() - last < ${suggestionLimits.cooldownMs}) return 'suggestion_cooldown'
      return ''
    })()
  ]]
  `,
});
