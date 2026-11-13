import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('suggestions.nation', `
  $onlyIf[$isValidClass[$toLowerCase[$option[class]]];
    $err[suggestion_invalid_class;true]
  ]
  $let[gate;$suggestionGate[$authorID]]
  $onlyIf[$get[gate]==;
    $err[$get[gate];true]
  ]

  $!js[ctx.interaction.deferReply({ flags: 64 })]
  $let[token;u$authorID-$getTimestamp]
  $let[spawn;$suggestionArt[$option[image];$get[token]_spawn]]
  $onlyIf[$get[spawn]!=;
    $err[suggestion_bad_image;true]
  ]
  $let[altUrl;$option[alt_image]]
  $if[$get[altUrl]!=;
    $let[window;$suggestionArt[$get[altUrl];$get[token]_window]]
    $onlyIf[$get[window]!=;
      $err[suggestion_bad_image;true]
    ]
  ]

  $jsonLoad[built;$suggestionFields[nation]]
  $!jsonSet[built;fields;spawn_art;$get[spawn]]
  $if[$get[window]!=;$!jsonSet[built;fields;window_art;$get[window]]]
  $let[id;$createSuggestion[nation;$authorID;$env[built;fields];$option[image];$get[altUrl]]]

  $interactionReply[
    $addTextDisplay[Your $jsonVar[keywords;collectible.singular] suggestion was submitted as **#$get[id]**. Staff will review it and you will get a DM when it is resolved.]
    $suggestionEmbed[$get[id];browse;mine;1]
  ]
  $!publishSuggestion[$get[id]]
`);
