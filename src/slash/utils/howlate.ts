import { slashCommand } from '../../core/slashes';

export default slashCommand('utils.howlate', `
  $let[rawMsg;$trim[$replace[$option[message];null;]]]
  $let[cleanMsg;$replace[$replace[$get[rawMsg];<;];>;]]
  $js[
    (() => {
      const raw = String(ctx.getKeyword('cleanMsg') || '').trim()
      let msgId = ''
      let targetChannel = String(ctx.channel?.id || '')
      if (raw.includes('/')) {
        const parts = raw.split('/').filter(Boolean)
        msgId = parts.at(-1) || ''
        if (parts.length >= 2) {
          targetChannel = parts.at(-2) || targetChannel
        }
      } else {
        msgId = raw
      }
      ctx.setKeyword('msgId', msgId)
      ctx.setKeyword('targetChannel', targetChannel)
    })()
  ]

  $let[ctbl;$spawnConfig[collectible]]
  $jsonLoad[catch_names;$collectibleInfo[$get[ctbl];catch_names]]
  $jsonLoad[translations;$collectibleInfo[$get[ctbl];translations]]
  $let[catcher;$spawnConfig[caught_by]]
  $let[catcher_time;$spawnConfig[caught_in]]
  $let[spawn_at;$spawnConfig[timestamp]]

  $onlyIf[$get[ctbl]!=;
    $err[no_spawn;true]
  ]
  $onlyIf[$get[catcher]!=;
    $err[collectible_not_caught;true]
  ]

  $if[$get[msgId]==;
    $let[msgId;$channelLastMessageID[$channelID]]
  ]
  $onlyIf[$get[msgId]!=;
    $err[reply_to_message;true]
  ]

  $let[user;$getMessage[$get[targetChannel];$get[msgId];authorID]]
  $let[content;$toLowerCase[$getMessage[$get[targetChannel];$get[msgId];content]]]
  $let[msgTimestamp;$getMessage[$get[targetChannel];$get[msgId];timestamp]]
  $let[user_time;$sub[$get[msgTimestamp];$get[spawn_at]]]

  $onlyIf[$get[user]!=;
    $err[reply_to_message;true]
  ]
  $onlyIf[$get[catcher]!=$get[user];
    $err[compare_self;true]
  ]
  $onlyIf[$get[user_time]>0;
    $err[message_sent_early;true]
  ]
  $onlyIf[$or[$arrayIncludes[catch_names;$get[content]];$arrayIncludes[translations;$get[content]]];
    $err[wrong_collectible;true]
  ]

  $interactionReply[
    $addContainer[
      $addSection[
        $addTextDisplay[### Timing Comparison
-# Spawn timing for $appEmoji[$collectibleInfo[$get[ctbl];emoji_id]] **$collectibleInfo[$get[ctbl];name]**]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addSeparator
      $addTextDisplay[<@$get[catcher]>: **$shortParse[$get[catcher_time];-1]**
<@$get[user]>: **$shortParse[$get[user_time];-1]**

-# Difference of **$shortParse[$sub[$get[user_time];$get[catcher_time]];-1]**]
    ;$jsonVar[config;accent]]
  ]
`);
