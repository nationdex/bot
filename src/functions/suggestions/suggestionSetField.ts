import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionEditFields, suggestionEconomies, suggestionRegimes } from '../../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionSetField',
  // Validates one edited field and merges it into a suggestion's fields JSON. Returns {"fields","changed","error"}; error is an errors.ts key or a message.
  params: [
    {
      name: 'base',
      // The suggestion's current fields JSON.
      type: 'String',
      required: true,
    },
    {
      name: 'field',
      // The field key, for example health or ability_name.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The raw submitted value.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[base;$env[base]]
  $let[field;$env[field]]
  $let[value;$env[value]]
  $let[classOk;$isValidClass[$toLowerCase[$env[value]]]]
  $return[$js[
    (() => {
      const meta = ${JSON.stringify(suggestionEditFields)}
      const regimes = '${suggestionRegimes.join(',')}'.split(',')
      const economies = '${suggestionEconomies.join(',')}'.split(',')
      const kw = (k) => String(ctx.getKeyword(k) ?? '')
      let fields = {}
      try {
        const parsed = JSON.parse(kw('base') || '{}')
        if (parsed && typeof parsed === 'object') fields = parsed
      } catch (e) {
        fields = {}
      }
      const key = kw('field')
      const info = Reflect.get(meta, key)
      const out = (error, changed) => JSON.stringify({ fields, changed: Boolean(changed), error })
      if (!info || info.kind === 'file') return out('suggestion_wrong_type', false)
      let v = kw('value').trim()
      if (!v) {
        if (!info.optional) return out(info.label + ' cannot be empty.', false)
        const had = Reflect.has(fields, key)
        Reflect.deleteProperty(fields, key)
        return out('', had)
      }
      if (info.max && info.kind === 'text' && v.length > info.max) return out(info.label + ' can be at most ' + info.max + ' characters.', false)
      if (info.kind === 'number') {
        const n = Number(v)
        if (!Number.isFinite(n)) return out(info.label + ' must be a number.', false)
        if (key === 'rarity' && (n < 0.01 || n > 100)) return out('Spawn weight must be between 0.01 and 100.', false)
        if (key !== 'rarity' && (!Number.isInteger(n) || n < 1 || n > 9999)) return out(info.label + ' must be a whole number from 1 to 9999.', false)
        v = n
      }
      if (key === 'class') {
        if (kw('classOk') !== 'true') return out('suggestion_invalid_class', false)
        v = v.toLowerCase()
      }
      if (key === 'regime' && !regimes.includes(v)) return out('Unknown regime.', false)
      if (key === 'economy' && !economies.includes(v)) return out('Unknown economy.', false)
      const same = Reflect.get(fields, key) === v
      Reflect.set(fields, key, v)
      return out('', !same)
    })()
  ]]
  `,
});
