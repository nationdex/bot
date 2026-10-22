import { SlashCommand } from '../../util/slashes';

export default SlashCommand('access.claim', `
  $let[s;$accessClaim]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Ownership claimed
You are now an owner. Use \`/access grant\` to give other people access.]
    ;$jsonVar[config;accent]]
  ]
`);
