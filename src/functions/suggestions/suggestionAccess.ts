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
  $jsonLoad[s;$default[$get[raw];{}]]
  $if[$env[s;id]==;$return[suggestion_not_found]]
  $let[open;$or[$env[s;status]==pending;$env[s;status]==changes_requested]]
  $if[$get[need]==ownerOpen;
    $if[$env[s;submitterId]!=$get[user];$return[suggestion_not_owner]]
    $if[$get[open]==false;$return[suggestion_not_open]]
  ]
  $if[$and[$get[need]==staffOpen;$get[open]==false];$return[suggestion_not_pending]]
  $if[$get[need]==vote;
    $if[$env[s;status]!=pending;$return[suggestion_voting_closed]]
    $if[$env[s;submitterId]==$get[user];$return[suggestion_self_vote]]
  ]
  $return[]
  `,
});
