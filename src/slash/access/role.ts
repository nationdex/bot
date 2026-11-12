import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.role', `
  $let[s;$accessSetRole[$option[name];$option[capabilities]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Role saved
- **Role:** \`$option[name]\`
- **Capabilities:** \`$option[capabilities]\`]
    ;$jsonVar[config;accent]]
  ]
`);
