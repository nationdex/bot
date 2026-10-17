import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionLimits } from '../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionList',
  // Renders the browse panel (mode browse) or the staff queue panel (mode queue): bullet list, filter menu, suggestion menu and pagination.
  params: [
    {
      name: 'mode',
      // browse (everyone) or queue (bot staff).
      type: 'String',
      required: true,
    },
    {
      name: 'filter',
      // browse: open, nations, features, mine, minenations, minefeatures or closed. queue: open, nations or features.
      type: 'String',
      required: false,
    },
    {
      name: 'page',
      // The page number, starting at 1.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[mode;$if[$env[mode]==queue;queue;browse]]
  $let[filter;$default[$replace[$env[filter];null;];open]]
  $let[page;$default[$replace[$env[page];null;];1]]
  $let[viewer;$authorID]
  $let[all;$listSuggestions[]]
  $let[nationWord;$toTitleCase[$jsonVar[keywords;collectible.singular]]]
  $let[channel;$getGlobalVar[suggestionsChannel;none]]

  $jsonLoad[pageData;$js[
    (async () => {
      const NL = String.fromCharCode(10)
      const kw = (k) => String(ctx.getKeyword(k) ?? '')
      let all = new Array()
      try {
        const v = JSON.parse(kw('all') || 'null')
        if (Array.isArray(v)) all = v
      } catch (e) {
        all = new Array()
      }
      const queue = kw('mode') === 'queue'
      const viewer = kw('viewer')
      const names = { open: 'All open', nations: 'Open ' + kw('nationWord') + 's', features: 'Open features', mine: 'My suggestions', minenations: 'My ' + kw('nationWord') + 's', minefeatures: 'My features', closed: 'Resolved' }
      let filter = kw('filter')
      if (!Reflect.has(names, filter) || (queue && !(filter === 'nations' || filter === 'features'))) filter = 'open'
      const isOpen = (s) => s.status === 'pending' || s.status === 'changes_requested'
      const type = filter.endsWith('nations') ? 'nation' : filter.endsWith('features') ? 'feature' : ''
      const mine = filter.startsWith('mine')
      const items = all
        .filter((s) => (type ? s.type === type : true))
        .filter((s) => (mine ? s.submitterId === viewer : filter === 'closed' ? !isOpen(s) : isOpen(s)))
        .sort((x, y) => y.voteCount - x.voteCount || x.id - y.id)
      const size = ${suggestionLimits.pageSize}
      const pages = Math.max(1, Math.ceil(items.length / size))
      const page = Math.min(pages, Math.max(1, parseInt(kw('page'), 10) || 1))
      const word = kw('nationWord')
      const slice = items.slice((page - 1) * size, page * size)
      const info = (s) => {
        const f = s.fields || {}
        const label = String((s.type === 'nation' ? f.name : f.title) || 'Untitled')
        return { label, kind: s.type === 'nation' ? word : 'Feature', votes: s.voteCount + ' vote' + (s.voteCount === 1 ? '' : 's'), status: String(s.status).split('_').join(' ') }
      }
      const tick = String.fromCharCode(96)
      const owners = queue
        ? await Promise.all(slice.map((s) => ctx.client.users.fetch(String(s.submitterId)).then((u) => u.username).catch(() => 'unknown')))
        : new Array()
      const lines = slice.map((s, n) => {
        const i = info(s)
        return '- **#' + s.id + '** · ' + i.kind + ' · **' + i.label.slice(0, 60) + '** · ' + i.votes + ' · ' + i.status + (queue ? ' · ' + tick + owners.at(n) + tick : '')
      })
      const options = slice.map((s) => {
        const i = info(s)
        return { id: String(s.id), name: ('#' + s.id + ' · ' + i.label).slice(0, 100), desc: (i.kind + ' · ' + i.votes + ' · ' + i.status).slice(0, 100) }
      })
      return JSON.stringify({
        text: lines.length ? lines.join(NL) : 'No suggestions match this filter.',
        filter,
        label: Reflect.get(names, filter),
        page,
        pages,
        total: items.length,
        options,
      })
    })()
  ]]

  $let[f;$env[pageData;filter]]
  $let[page;$env[pageData;page]]
  $let[pages;$env[pageData;pages]]
  $jsonLoad[options;$env[pageData;options]]
  $let[p;$if[$get[mode]==queue;q;b]]
  $let[prevEmoji;$appEmoji[arrow_left]]
  $let[nextEmoji;$appEmoji[arrow_right]]

  $return[
    $addContainer[
      $addTextDisplay[## $if[$get[mode]==queue;Suggestion queue;Suggestions]
-# $env[pageData;total] result$if[$env[pageData;total]!=1;s] · $env[pageData;label]]
      $addSeparator
      $addTextDisplay[$env[pageData;text]]
      $if[$get[mode]==queue;
        $addSeparator
        $addTextDisplay[- **Public channel:** $if[$or[$get[channel]==none;$get[channel]==];Posting is disabled;<#$get[channel]>]
-# Pick a channel to post new suggestions with vote buttons. The bot needs to send messages and attach files there.]
      ]
      $addSeparator
      $addActionRow
      $addStringSelectMenu[suggestion-$get[p]f;Filter suggestions]
      $addOption[All open;Pending and changes requested;open;;$checkCondition[$get[f]==open]]
      $addOption[Open $get[nationWord]s;$get[nationWord] suggestions only;nations;;$checkCondition[$get[f]==nations]]
      $addOption[Open features;Features and bugs only;features;;$checkCondition[$get[f]==features]]
      $if[$get[mode]==browse;
        $addOption[My suggestions;Everything you submitted;mine;;$checkCondition[$get[f]==mine]]
        $addOption[My $get[nationWord]s;Your $get[nationWord] suggestions;minenations;;$checkCondition[$get[f]==minenations]]
        $addOption[My features;Your feature and bug suggestions;minefeatures;;$checkCondition[$get[f]==minefeatures]]
        $addOption[Resolved;Approved and denied;closed;;$checkCondition[$get[f]==closed]]
      ]
      $addActionRow
      $if[$arrayLength[options]>0;
        $addStringSelectMenu[suggestion-$get[p]s-$get[f]-$get[page];Select a suggestion]
        $arrayForEach[options;opt;
          $addOption[$env[opt;name];$env[opt;desc];$env[opt;id]]
        ]
      ;
        $addStringSelectMenu[suggestion-$get[p]s-$get[f]-$get[page];Nothing to select;true]
        $addOption[None;None;none]
      ]
      $if[$get[mode]==queue;
        $addActionRow
        $addChannelSelectMenu[suggestion-qch-$get[f]-$get[page];Set the public suggestions channel;1;1]
        $addChannelType[GuildText;GuildAnnouncement]
      ]
      $addActionRow
      $addButton[suggestion-$get[p]-$get[f]-$sub[$get[page];1];$if[$get[prevEmoji]==;Previous];Secondary;$get[prevEmoji];$if[$get[page]<=1;true;false]]
      $addButton[suggestion-pageinfo-$get[p];Page $get[page] / $get[pages];Primary;;true]
      $addButton[suggestion-$get[p]-$get[f]-$sum[$get[page];1];$if[$get[nextEmoji]==;Next];Secondary;$get[nextEmoji];$if[$get[page]>=$get[pages];true;false]]
      $if[$get[mode]==queue;
        $addButton[suggestion-qoff-$get[f]-$get[page];Disable posting;Danger;;$checkCondition[$or[$get[channel]==none;$get[channel]==]]]
      ]
    ;$jsonVar[config;accent]]
  ]
  `,
});
