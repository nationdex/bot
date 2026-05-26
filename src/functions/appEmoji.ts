import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'appEmoji',
  // Get an application emoji from the given identifier.
  params: [
    {
      name: 'emoji',
      // The emoji/name/id
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value to get, name/id/emoji/url
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[em;$findApplicationEmoji[$env[emoji]]]
  
  $onlyIf[$get[em]!=;$return[]]
  $ifx[
    $if[$env[value]==id;
      $return[$get[em]]
    ]
    $elseIf[$env[value]==name;
      $return[$emojiName[$get[em]]]
    ]
    $elseIf[$env[value]==url;
      $return[$emojiURL[$get[em]]]
    ]
    $else[
      $return[$emoji[$get[em]]]
    ]
  ]
  `,
});
