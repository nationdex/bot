import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionLimits } from '../../config/suggestions';

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
  $jsonLoad[all;$listSuggestions[]]
  $let[user;$env[user]]
  $arrayFilter[all;s;$env[s;submitterId]==$get[user];mine]
  $arrayFilter[mine;s;$or[$env[s;status]==pending;$env[s;status]==changes_requested];open]
  $if[$arrayLength[open]>=${suggestionLimits.maxOpenPerUser};
    $return[suggestion_limit]
  ]
  $let[last;0]
  $let[now;$getTimestamp]
  $arrayForEach[mine;s;
    $let[t;$unparseDate[$env[s;createdAt]]]
    $if[$get[t]>$get[last];$let[last;$get[t]]]
  ]
  $if[$and[$get[last]>0;$sub[$get[now];$get[last]]<${suggestionLimits.cooldownMs}];
    $return[suggestion_cooldown]
  ]
  $return[]
  `,
});
