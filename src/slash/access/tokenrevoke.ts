import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('api.tokenrevoke', `
  $let[s;$accessTokenRevoke[$option[user]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## API tokens revoked]
    ;$jsonVar[config;accent]]
  ]
`);
