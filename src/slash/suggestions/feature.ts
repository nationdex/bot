import { SlashCommand } from '../../core/slashes';

export default SlashCommand('suggestions.feature', `
  $let[gate;$suggestionGate[$authorID]]
  $onlyIf[$get[gate]==;
    $err[$get[gate];true]
  ]

  $modal[suggestion-fm;New feature or bug report]
  $addTextInput[title;Title;Short;true;A short summary;;1;100]
  $addTextInput[description;Description;Paragraph;true;What should change, or how can the bug be reproduced?;;1;1500]
  $showModal
`);
