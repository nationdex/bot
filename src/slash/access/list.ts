import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.list', `
  $let[text;$accessList[$option[user]]]
  $onlyIf[$get[text]!=denied;$err[access_denied;true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$get[text]]
    ;$jsonVar[config;accent]]
  ]
`);
