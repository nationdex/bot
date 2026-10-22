import { SlashCommand } from '../../util/slashes';

export default SlashCommand('access.roles', `
  $let[text;$accessList[]]
  $onlyIf[$get[text]!=denied;$err[access_denied;true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$get[text]]
    ;$jsonVar[config;accent]]
  ]
`);
