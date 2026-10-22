import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'resolveSuggestion',
  // Sets a suggestion's status and staff note, DMs the submitter (DM failures ignored) and refreshes its public message.
  params: [
    {
      name: 'id',
      // The suggestion id.
      type: 'String',
      required: true,
    },
    {
      name: 'status',
      // approved, denied or changes_requested.
      type: 'String',
      required: true,
    },
    {
      name: 'note',
      // Optional staff note shown on the suggestion and in the DM.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[status;$env[status]]
  $let[note;$if[$env[note]==null;;$env[note]]]
  $let[raw;$getSuggestion[$get[id]]]
  $jsonLoad[s;$get[raw]]

  $let[newFields;$js[
    (() => {
      const s = JSON.parse(String(ctx.getKeyword('raw')))
      const f = s.fields || {}
      Reflect.set(f, 'staff_note', String(ctx.getKeyword('note') || ''))
      return JSON.stringify(f)
    })()
  ]]
  $!updateSuggestion[$get[id];$get[status];$get[newFields]]

  $let[label;$if[$env[s;type]==nation;$env[s;fields;name];$env[s;fields;title]]]
  $ifx[
    $if[$get[status]==approved;
      $let[verdict;was **approved**! Thank you for contributing.]
    ]
    $elseif[$get[status]==denied;
      $let[verdict;was **denied**.]
    ]
    $else[
      $let[verdict;needs changes. Open \`/suggestions browse\`, pick it and press **Edit** and it goes back into the review queue.]
    ]
  ]
  $try[
    $!sendDM[$env[s;submitterId];Your suggestion **#$get[id]** ($get[label]) $get[verdict]$if[$get[note]!=;
**Staff note:** $get[note]]]
  ;]
  $!refreshSuggestion[$get[id]]
  `,
});
