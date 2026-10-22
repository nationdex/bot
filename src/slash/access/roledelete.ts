import { SlashCommand } from '../../util/slashes';

export default SlashCommand('access.roledelete', `
  $let[s;$accessDeleteRole[$option[name]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Role deleted
- **Role:** \`$option[name]\`]
    ;$jsonVar[config;accent]]
  ]
`);
