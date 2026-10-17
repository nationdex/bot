import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionLimits } from '../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionEmbed',
  // Renders one suggestion as a Components v2 container. mode: public (channel post), browse (submitter/voter detail) or queue (staff detail).
  params: [
    {
      name: 'id',
      // The suggestion id to render.
      type: 'String',
      required: true,
    },
    {
      name: 'mode',
      // public, browse or queue.
      type: 'String',
      required: false,
    },
    {
      name: 'filter',
      // The list filter code to return to with Back (browse and queue only).
      type: 'String',
      required: false,
    },
    {
      name: 'page',
      // The list page to return to with Back (browse and queue only).
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[mode;$default[$replace[$env[mode];null;];public]]
  $let[filter;$default[$replace[$env[filter];null;];open]]
  $let[page;$default[$replace[$env[page];null;];1]]
  $let[viewer;$authorID]
  $let[raw;$getSuggestion[$get[id]]]
  $jsonLoad[s;$get[raw]]
  $jsonLoad[fields;$env[s;fields]]
  $let[status;$env[s;status]]
  $let[votes;$env[s;voteCount]]
  $let[closed;$if[$get[status]==pending;false;true]]
  $let[open;$if[$or[$get[status]==pending;$get[status]==changes_requested];true;false]]
  $let[isOwner;$checkCondition[$env[s;submitterId]==$get[viewer]]]
  $let[nationWord;$toTitleCase[$jsonVar[keywords;collectible.singular]]]

  $ifx[
    $if[$get[status]==approved;
      $let[color;#2ECC71]
    ]
    $elseif[$get[status]==denied;
      $let[color;#E74C3C]
    ]
    $elseif[$get[status]==changes_requested;
      $let[color;#F1C40F]
    ]
    $else[
      $let[color;$jsonVar[config;accent]]
    ]
  ]

  $jsonLoad[view;$js[
    (async () => {
      const NL = String.fromCharCode(10)
      const tick = String.fromCharCode(96)
      const kw = (k) => String(ctx.getKeyword(k) ?? '')
      const s = JSON.parse(kw('raw') || '{}')
      const f = s.fields || {}
      const code = (v) => tick + String(v) + tick
      const submitter = await ctx.client.users.fetch(String(s.submitterId)).catch(() => null)
      const labels = { pending: '🕒 Pending', approved: '✅ Approved', denied: '❌ Denied', changes_requested: '✏️ Changes requested' }
      const nation = s.type === 'nation'
      const lines = new Array()
      lines.push('- **Type:** ' + (nation ? kw('nationWord') : 'Feature / Bug'))
      lines.push('- **Submitter:** ' + code(submitter && submitter.username ? submitter.username : 'unknown'))
      lines.push('- **Status:** ' + Reflect.get(labels, s.status))
      lines.push('- **Votes:** ' + s.voteCount)
      if (nation) {
        lines.push('- **Name:** ' + f.name + (f.short_name ? ' (' + f.short_name + ')' : ''))
        lines.push('- **Class:** ' + code(f.class) + ' · **Spawn weight:** ' + code(f.rarity))
        lines.push('- **Regime:** ' + code(f.regime) + ' · **Economy:** ' + code(String(f.economy || '').split('.png').join('')))
        lines.push('- **Health / Attack:** ' + code(f.health) + ' / ' + code(f.attack))
        lines.push('- **Ability:** **' + f.ability_name + '** · ' + f.ability_description)
        lines.push('- **Catch names:** ' + code(f.catch_names))
        if (f.translations) lines.push('- **Translations:** ' + code(f.translations))
        lines.push('- **Artist:** ' + f.artist)
      } else {
        lines.push('- **Title:** ' + f.title)
      }
      if (f.staff_note) lines.push('- **Staff note:** ' + f.staff_note)
      return JSON.stringify({ facts: lines.join(NL), description: nation ? '' : String(f.description || '') })
    })()
  ]]

  $let[spawnName;$env[fields;spawn_art]]
  $let[windowName;$env[fields;window_art]]
  $let[hasSpawn;$and[$get[spawnName]!=;$fileExists[${suggestionLimits.stagingDir}/$get[spawnName]]]]
  $let[hasWindow;$and[$get[windowName]!=;$fileExists[${suggestionLimits.stagingDir}/$get[windowName]]]]
  $if[$get[hasSpawn];$attachment[${suggestionLimits.stagingDir}/$get[spawnName];$get[spawnName]]]
  $if[$get[hasWindow];$attachment[${suggestionLimits.stagingDir}/$get[windowName];$get[windowName]]]
  $let[voted;$hasVotedSuggestion[$get[id];$get[viewer]]]
  $let[tail;$get[id]-$get[filter]-$get[page]]

  $return[
    $addContainer[
      $addTextDisplay[## Suggestion #$get[id]]
      $addSeparator
      $addTextDisplay[$env[view;facts]]
      $if[$env[view;description]!=;
        $addSeparator
        $addTextDisplay[$env[view;description]]
      ]
      $if[$or[$get[hasSpawn];$get[hasWindow]];
        $addMediaGallery[
          $if[$get[hasSpawn];$addMediaItem[attachment://$get[spawnName];Spawn art]]
          $if[$get[hasWindow];$addMediaItem[attachment://$get[windowName];Collection art]]
        ]
      ]
      $addSeparator
      $ifx[
        $if[$get[mode]==browse;
          $addTextDisplay[-# $if[$and[$get[isOwner];$get[open]];You can edit or withdraw this suggestion while it is open.;Upvote suggestions you would like to see. Staff review the most voted ones first.]]
          $addActionRow
          $addButton[suggestion-dv-$get[tail];$if[$get[voted];Upvoted;Upvote] ($get[votes]);$if[$get[voted];Primary;Success];⬆️;$or[$get[closed];$get[isOwner]]]
          $addButton[suggestion-info-$get[id];Details;Secondary;ℹ️]
          $addButton[suggestion-b-$get[filter]-$get[page];Back;Secondary;↩️]
          $if[$and[$get[isOwner];$get[open]];
            $addButton[suggestion-edit-$get[tail];Edit;Primary;✏️]
            $addButton[suggestion-wd-$get[tail];Withdraw;Danger;🗑️]
          ]
        ]
        $elseif[$get[mode]==queue;
          $addTextDisplay[-# Staff review. The submitter is notified by DM when you resolve it.]
          $addActionRow
          $addButton[suggestion-qa-$get[tail];Approve;Success;✅;$if[$get[open];false;true]]
          $addButton[suggestion-qc-$get[tail];Request changes;Primary;✏️;$if[$get[open];false;true]]
          $addButton[suggestion-qd-$get[tail];Deny;Danger;❌;$if[$get[open];false;true]]
          $addButton[suggestion-q-$get[filter]-$get[page];Back;Secondary;↩️]
        ]
        $else[
          $addTextDisplay[-# Upvote suggestions you would like to see. Staff review the most voted ones first.]
          $addActionRow
          $addButton[suggestion-vote-$get[id];Upvote ($get[votes]);Success;⬆️;$get[closed]]
          $addButton[suggestion-info-$get[id];Details;Secondary;ℹ️]
        ]
      ]
    ;$get[color]]
  ]
  `,
});
