import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.audit', `
  $let[text;$accessAudit[15]]
  $onlyIf[$get[text]!=denied;$err[access_denied;true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$get[text]]
    ;$jsonVar[config;accent]]
  ]
`);
