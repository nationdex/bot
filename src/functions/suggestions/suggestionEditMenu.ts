import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionEditFields } from '../../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionEditMenu',
  // Renders the field picker for editing a suggestion: a select menu of editable fields and a cancel button.
  params: [
    {
      name: 'id',
      // The suggestion id.
      type: 'String',
      required: true,
    },
    {
      name: 'filter',
      // The list filter code to return to.
      type: 'String',
      required: true,
    },
    {
      name: 'page',
      // The list page to return to.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[raw;$getSuggestion[$get[id]]]
  $jsonLoad[opts;$js[
    (() => {
      const meta = ${JSON.stringify(suggestionEditFields)}
      const s = JSON.parse(String(ctx.getKeyword('raw') || '{}'))
      const f = s.fields || {}
      const keys = Object.keys(meta).filter((k) => Reflect.get(meta, k).type === s.type)
      const show = (k) => {
        const info = Reflect.get(meta, k)
        if (info.kind === 'file') return Reflect.get(f, k) ? 'Replace the current image' : 'Add an image'
        const v = String(Reflect.get(f, k) ?? '').split(String.fromCharCode(10)).join(' ')
        return v ? 'Now: ' + v.slice(0, 80) : 'Not set'
      }
      return JSON.stringify(keys.map((k) => ({ key: k, name: Reflect.get(meta, k).label, desc: show(k) })))
    })()
  ]]
  $return[
    $addContainer[
      $addTextDisplay[## Edit suggestion #$get[id]
-# Pick the field to change. Editing puts the suggestion back in the review queue.]
      $addSeparator
      $addActionRow
      $addStringSelectMenu[suggestion-ef-$get[id]-$env[filter]-$env[page];Select a field to edit]
      $arrayForEach[opts;opt;
        $addOption[$env[opt;name];$env[opt;desc];$env[opt;key]]
      ]
      $addActionRow
      $addButton[suggestion-bd-$get[id]-$env[filter]-$env[page];Cancel;Secondary;↩️]
    ;$jsonVar[config;accent]]
  ]
  `,
});
