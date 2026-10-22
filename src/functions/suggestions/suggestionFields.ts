import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'suggestionFields',
  // Reads the current slash command options into a suggestion's fields JSON, merged over existing fields. Returns {"fields","changed","error"}.
  params: [
    {
      name: 'type',
      // The suggestion type: nation or feature.
      type: 'String',
      required: true,
    },
    {
      name: 'base',
      // Existing fields JSON to merge over (for edits).
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[base;$env[base]]
  $return[$js[
    (() => {
      const type = String(ctx.getEnvironmentKey('type'))
      const rawBase = String(ctx.getKeyword('base') || '')
      let fields = {}
      try {
        const parsed = rawBase && rawBase !== 'null' ? JSON.parse(rawBase) : {}
        if (parsed && typeof parsed === 'object') fields = parsed
      } catch (e) {
        fields = {}
      }
      const nationKeys = 'name short_name catch_names translations class rarity health attack regime economy ability_name ability_description artist'.split(' ')
      const featureKeys = 'title description'.split(' ')
      const own = type === 'nation' ? nationKeys : featureKeys
      const other = type === 'nation' ? featureKeys : nationKeys.concat('image alt_image'.split(' '))
      const opts = ctx.interaction && ctx.interaction.options
      const read = (key) => {
        const opt = opts ? opts.get(key) : null
        if (!opt || opt.value === undefined || opt.value === null) return undefined
        return typeof opt.value === 'string' ? opt.value.trim() : opt.value
      }
      if (other.some((k) => read(k) !== undefined)) return JSON.stringify({ fields, changed: 0, error: 'suggestion_wrong_type' })
      let changed = 0
      own.forEach((k) => {
        let v = read(k)
        if (v === undefined || v === '') return
        if (k === 'class') v = String(v).toLowerCase()
        if (k === 'rarity' || k === 'health' || k === 'attack') v = Number(v)
        Reflect.set(fields, k, v)
        changed += 1
      })
      return JSON.stringify({ fields, changed, error: '' })
    })()
  ]]
  `,
});
