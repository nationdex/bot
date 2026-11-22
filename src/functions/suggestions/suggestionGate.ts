import { ForgeFunction } from '@tryforge/forgescript';

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
  $jsonLoad[stats;$getSuggestionStats[$env[user]]]
  $if[$env[stats;openCount]>=$jsonVar[config;suggestions.maxOpenPerUser;3];
    $return[suggestion_limit]
  ]
  $let[last;$default[$env[stats;latestSubmissionAt];0]]
  $let[now;$getTimestamp]
  $if[$and[$get[last]>0;$sub[$get[now];$get[last]]<$jsonVar[config;suggestions.cooldownMs;600000]];
    $return[suggestion_cooldown]
  ]
  $return[]
  `,
});
