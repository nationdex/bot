import { SlashCommand } from '../../util/slashes';

export default SlashCommand('access.grant', `
  $let[s;$accessGrant[$option[user];$option[access];$option[hours];$option[reason]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Access granted
- **User:** \`$fetchUsername[$option[user]]\`
- **Access:** \`$option[access]\`]
    ;$jsonVar[config;accent]]
  ]
`);
