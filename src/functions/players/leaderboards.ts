import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'leaderboards',
  // Display the top 15 leaderboard as a fast, clean Components v2 message without pagination
  params: [
    {
      name: 'type',
      // The leaderboard type
      type: 'String',
      required: true
    },
    {
      name: 'page',
      // Unused (kept for backwards compatibility)
      type: 'String',
      required: false
    },
    {
      name: 'class',
      // The rarity class to view the leaderboard of
      type: 'String',
      required: false
    },
  ],
  code: `$let[type;$env[type]]

  $ifx[
    $if[$get[type]==collectibles;
      $jsonLoad[db;$default[$searchDB[userCollectibles];[\\]]]
      $jsonLoad[classes;$collectiblesData[classes]]
      $let[rawClass;$toLowerCase[$default[$replace[$env[class];null;];total]]]
      $let[targetClass;$if[$arrayIncludes[classes;$get[rawClass]];$get[rawClass];total]]
      $let[title;$if[$get[targetClass]!=total;$toTitleCase[$get[targetClass]] ]$toTitleCase[$jsonVar[keywords;collectible.plural]] Leaderboard]
      $let[emoji;]
    ]

    $elseIf[$get[type]==value;
      $jsonLoad[db;$default[$searchDB[userCollectibles];[\\]]]
      $let[targetClass;total_value]
      $let[title;$toTitleCase[$jsonVar[keywords;collectible.plural]] Value Leaderboard]
      $let[emoji;]
    ]

    $elseIf[$get[type]==balance;
      $jsonLoad[db;$default[$searchDB[balance];[\\]]]
      $let[targetClass;balance]
      $let[title;$toTitleCase[$jsonVar[keywords;currency.plural]] Leaderboard]
      $let[emoji;]
    ]
  ]

  $js[
    (async () => {
      const records = ctx.getEnvironmentKey('db') || new Array()
      const lbType = String(ctx.getKeyword('type') || ctx.getEnvironmentKey('type') || 'collectibles')
      const targetClass = String(ctx.getKeyword('targetClass') || ctx.getEnvironmentKey('targetClass') || 'total')
      const authorID = String(ctx.user?.id || ctx.getKeyword('authorID') || ctx.getEnvironmentKey('authorID') || '')
      const emoji = String(ctx.getKeyword('emoji') || ctx.getEnvironmentKey('emoji') || '')

      const list = new Array()
      for (let i = 0; i < records.length; i++) {
        const r = records.at(i)
        if (!r || !r.id) continue
        let score = 0
        if (lbType === 'balance') {
          score = Number(r.value) || 0
        } else {
          try {
            const v = typeof r.value === 'string' ? JSON.parse(r.value) : r.value
            score = Number(Reflect.get(v, targetClass)) || 0
          } catch (e) {
            score = 0
          }
        }
        list.push({ id: String(r.id), score })
      }

      list.sort((a, b) => b.score - a.score)

      const authorIdx = list.findIndex(x => x.id === authorID)
      const position = (authorIdx !== -1 && list.at(authorIdx).score > 0) ? ('at #' + (authorIdx + 1)) : 'unranked'

      const top15 = list.filter(x => x.score > 0).slice(0, 15)

      await Promise.all(
        top15.map(async (entry) => {
          if (ctx.client?.users?.cache?.has(entry.id)) return
          try {
            await ctx.client?.users?.fetch(entry.id)
          } catch (e) {}
        })
      )

      const openBr = String.fromCharCode(91)
      const closeBr = String.fromCharCode(93)

      const lines = top15.map((entry, idx) => {
        const rank = idx + 1
        const u = ctx.client?.users?.cache?.get(entry.id)
        const rawName = u ? u.username : entry.id
        const safeName = String(rawName).replaceAll(openBr, '').replaceAll(closeBr, '')
        const numStr = Number.isInteger(entry.score)
          ? entry.score.toLocaleString('en-US')
          : entry.score.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
        const emStr = emoji ? (' ' + emoji) : ''
        return rank + '. ' + openBr + safeName + closeBr + '(https://discord.com/users/' + entry.id + ') - **' + numStr + '**' + emStr
      })

      ctx.setEnvironmentKey('lbDisplay', lines.join(String.fromCharCode(10)) || 'Nothing to see here...')
      ctx.setEnvironmentKey('lbPosition', position)
    })()
  ]

  $return[
    $addContainer[
      $addTextDisplay[### $get[title]]
      $addSeparator
      $addTextDisplay[$env[lbDisplay]]
      $addSeparator
      $addTextDisplay[-# You are $env[lbPosition] on the leaderboard]
    ;$jsonVar[config;accent]]
  ]
  `
});
