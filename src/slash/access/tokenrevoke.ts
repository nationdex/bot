import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.tokenrevoke', `
  $let[s;$accessTokenRevoke[$option[user]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## API tokens revoked]
    ;$jsonVar[config;accent]]
  ]
`);
