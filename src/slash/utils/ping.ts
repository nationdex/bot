import { slashCommand } from '../../util/slashes';

export default slashCommand('utils.ping', `
  $let[start;$getTimestamp]
  $interactionReply[Pinging $jsonVar[config;bot.name]...]
  $let[roundtrip;$sub[$getTimestamp;$get[start]]]
  $let[wsPing;$ping]
  $let[dbPing;$dbPing]

  $interactionUpdate[
    $addContainer[
      $addSection[
        $addTextDisplay[## :ping_pong: Pong!
-# Latency measurements for **$jsonVar[config;bot.name]**]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addSeparator
      $addTextDisplay[- **WebSocket**: \`$get[wsPing]ms\`
- **Round-Trip**: \`$get[roundtrip]ms\`
- **Database**: \`$get[dbPing]ms\`]
    ;$jsonVar[config;accent]]
  ]
`);
