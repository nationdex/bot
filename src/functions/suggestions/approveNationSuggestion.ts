import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionLimits } from '../../config/suggestions';

export default new ForgeFunction({
  name: 'approveNationSuggestion',
  // Validates a nation suggestion, copies its art into the configured art paths and inserts it into collectiblesData under the next free ID. Returns {"ok","id","error","warnings"}.
  params: [
    {
      name: 'id',
      // The suggestion id to approve.
      type: 'String',
      required: true,
    },
    {
      name: 'emojiId',
      // Resolved emoji ID (application or server emoji) for the new catalog entry.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[raw;$getSuggestion[$env[id]]]
  $let[lock;$mutex[acquire;catalog]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[spawnDir;$jsonVar[config;paths.spawn_art]]
  $let[windowDir;$jsonVar[config;paths.window_art]]
  $let[cardsDir;$jsonVar[config;paths.cards]]
  $let[iconsDir;$jsonVar[config;paths.icons]]

  $let[result;$js[
    (async () => {
      const fs = require('fs')
      const path = require('path')
      const kw = (k) => String(ctx.getKeyword(k) ?? '')
      const fail = (error) => JSON.stringify({ ok: false, id: '', error, warnings: new Array() })
      const s = JSON.parse(kw('raw') || '{}')
      const f = s.fields || {}
      const data = JSON.parse(kw('catalog') || '{}')
      const collectibles = data.collectibles || {}
      const classes = Array.isArray(data.classes) ? data.classes : new Array()

      const name = String(f.name || '').trim()
      if (!name || name.length > 48) return fail('The name must be 1-48 characters.')
      if (!classes.includes(String(f.class))) return fail('Unknown class: ' + f.class)
      if (!(Number(f.rarity) > 0)) return fail('Spawn weight must be a positive number.')
      if (!Number.isFinite(Number(f.health)) || !Number.isFinite(Number(f.attack))) return fail('Health and attack must be numbers.')
      if (!f.regime || !fs.existsSync(path.join(kw('cardsDir'), f.regime + '.png'))) return fail('No card background exists for regime: ' + f.regime)
      if (!f.economy || !fs.existsSync(path.join(kw('iconsDir'), String(f.economy)))) return fail('No icon exists for economy: ' + f.economy)

      const lower = name.toLowerCase()
      const existing = Object.values(collectibles)
      if (existing.some((c) => c && String(c.name || '').toLowerCase() === lower)) return fail('A catalog entry named ' + name + ' already exists.')

      const toList = (raw) => Array.from(new Set(String(raw || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)))
      const shortName = String(f.short_name || '').trim()
      const catchNames = Array.from(new Set(toList(f.catch_names).concat(lower, shortName ? shortName.toLowerCase() : lower)))
      const translations = toList(f.translations).filter((t) => !catchNames.includes(t))
      const taken = new Map()
      Object.keys(collectibles).forEach((key) => {
        const c = Reflect.get(collectibles, key) || {}
        const all = (Array.isArray(c.catch_names) ? c.catch_names : new Array()).concat(Array.isArray(c.translations) ? c.translations : new Array())
        all.forEach((a) => taken.set(String(a).toLowerCase(), key))
      })
      const warnings = catchNames.concat(translations).filter((a) => taken.has(a)).map((a) => 'Catch name ' + a + ' is also used by #' + taken.get(a))

      const staging = '${suggestionLimits.stagingDir}'
      const stage = async (file, url, suffix) => {
        if (file && fs.existsSync(path.join(staging, file))) return file
        if (!url) return ''
        try {
          const res = await fetch(url)
          const type = String(res.headers.get('content-type') || '')
          const ext = type.includes('png') ? 'png' : type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : ''
          if (!res.ok || !ext) return ''
          const out = 'suggestion' + s.id + '_' + suffix + '.' + ext
          fs.mkdirSync(staging, { recursive: true })
          fs.writeFileSync(path.join(staging, out), Buffer.from(await res.arrayBuffer()))
          return out
        } catch (e) {
          return ''
        }
      }
      const spawnFile = await stage(f.spawn_art, s.imageUrl, 'spawn')
      if (!spawnFile) return fail('The spawn art is missing and its Discord link has expired. Ask the submitter to re-upload it from /suggestions browse (Edit).')
      const windowFile = (await stage(f.window_art, s.altImageUrl, 'window')) || spawnFile

      const nextId = String(Object.keys(collectibles).map((k) => parseInt(k, 10)).filter((n) => Number.isFinite(n)).reduce((a, b) => Math.max(a, b), 0) + 1)
      const allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const safe = Array.from(shortName || name).filter((c) => allowed.includes(c)).join('') || 'Nation' + nextId
      const place = (dir, src, suffix) => {
        const ext = path.extname(src)
        let out = safe + suffix + ext
        if (fs.existsSync(path.join(kw(dir), out))) out = safe + suffix + nextId + ext
        fs.mkdirSync(kw(dir), { recursive: true })
        fs.copyFileSync(path.join(staging, src), path.join(kw(dir), out))
        return out
      }
      const wildCard = place('spawnDir', spawnFile, '')
      const collectionCard = place('windowDir', windowFile, 'Flag')

      Reflect.set(collectibles, nextId, {
        class: String(f.class),
        rarity: Number(f.rarity),
        weight: Number(f.rarity),
        name,
        short_name: shortName || null,
        regime: String(f.regime),
        economy: String(f.economy),
        collection_card: collectionCard,
        wild_card: wildCard,
        capacity_name: String(f.ability_name || ''),
        capacity_description: String(f.ability_description || ''),
        credits: String(f.artist || ''),
        attack: Math.round(Number(f.attack)),
        health: Math.round(Number(f.health)),
        emoji_id: String(ctx.getEnvironmentKey('emojiId') ?? ''),
        translations,
        catch_names: catchNames,
        global_caught: 0,
        price: 0,
        sell_price: 0,
      })
      data.collectibles = collectibles
      data.total = Object.keys(collectibles).length
      Reflect.set(data, String(f.class), (Number(Reflect.get(data, String(f.class))) || 0) + 1)
      ctx.setKeyword('newCatalog', JSON.stringify(data))
      return JSON.stringify({ ok: true, id: nextId, error: '', warnings })
    })()
  ]]

  $jsonLoad[res;$get[result]]
  $if[$env[res;ok];
    $setGlobalVar[collectiblesData;$get[newCatalog]]
  ]
  $!mutex[release;catalog;$get[lock]]
  $return[$get[result]]
  `,
});
