import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.token', `
  $let[s;$accessToken]
  $onlyIf[$startsWith[$get[s];ok:];$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## API token
Copy it now, it is shown only once. Send it as \`Authorization: Bearer <token>\`. What it can do always follows your current access.
\`\`\`
$replace[$get[s];ok:;]
\`\`\`]
    ;$jsonVar[config;accent]]
  ]
`);
