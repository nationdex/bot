import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.revoke', `
  $let[s;$accessRevoke[$option[user];$option[access]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Access revoked
- **User:** \`$fetchUsername[$option[user]]\`
- **Access:** \`$option[access]\`]
    ;$jsonVar[config;accent]]
  ]
`);
