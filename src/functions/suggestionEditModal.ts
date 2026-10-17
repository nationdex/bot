import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionEditFields, suggestionEconomies, suggestionRegimes } from '../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionEditModal',
  // Builds and shows the single-field edit modal for a suggestion. It is the interaction response, so nothing may reply before it.
  params: [
    {
      name: 'id',
      // The suggestion id.
      type: 'String',
      required: true,
    },
    {
      name: 'field',
      // The field key to edit.
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
  $let[field;$env[field]]
  $jsonLoad[s;$getSuggestion[$get[id]]]
  $jsonLoad[meta;${JSON.stringify(suggestionEditFields)}]
  $let[kind;$env[meta;$get[field];kind]]
  $let[label;$env[meta;$get[field];label]]
  $let[hint;$env[meta;$get[field];hint]]
  $let[max;$env[meta;$get[field];max]]
  $let[current;$env[s;fields;$get[field]]]
  $let[required;$if[$env[meta;$get[field];optional]==true;false;true]]
  $let[style;$if[$env[meta;$get[field];style]==paragraph;Paragraph;Short]]
  $arrayLoad[regimes;,;${suggestionRegimes.join(',')}]
  $arrayLoad[economies;,;${suggestionEconomies.join(',')}]
  $jsonLoad[catalog;$getGlobalVar[collectiblesData]]
  $jsonLoad[classes;$env[catalog;classes]]

  $modal[suggestion-em-$get[id]-$get[field]-$env[filter]-$env[page];Edit #$get[id]: $get[label]]
  $ifx[
    $if[$or[$get[kind]==text;$get[kind]==number];
      $addLabel[$get[label];$get[hint];
        $addTextInput[value;$get[label];$get[style];$get[required];;$get[current];;$get[max]]
      ]
    ]
    $elseif[$get[field]==class;
      $addLabel[$get[label];Pick the new rarity class;
        $addStringSelectMenu[value;Choose a class;false;1;1;true]
        $arrayForEach[classes;c;
          $addOption[$toTitleCase[$env[c]];;$env[c];;$checkCondition[$env[c]==$get[current]]]
        ]
      ]
    ]
    $elseif[$get[field]==regime;
      $addLabel[$get[label];Sets the card background;
        $addStringSelectMenu[value;Choose a regime;false;1;1;true]
        $arrayForEach[regimes;r;
          $addOption[$toTitleCase[$env[r]];;$env[r];;$checkCondition[$env[r]==$get[current]]]
        ]
      ]
    ]
    $elseif[$get[field]==economy;
      $addLabel[$get[label];Sets the card badge;
        $addStringSelectMenu[value;Choose an economy;false;1;1;true]
        $arrayForEach[economies;e;
          $addOption[$toTitleCase[$replace[$env[e];.png;]];;$env[e];;$checkCondition[$env[e]==$get[current]]]
        ]
      ]
    ]
    $else[
      $addLabel[$get[label];PNG, JPG or WEBP, up to 8 MB;
        $addFileUpload[value;1;1;true]
      ]
    ]
  ]
  $showModal
  `,
});
