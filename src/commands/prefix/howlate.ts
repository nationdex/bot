import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  name: 'howlate',
  aliases: ['hl'],
  description:
    'Check how late you were from the user who caught the last nation by replying to your message',
  usage: '',
  type: 'messageCreate',
  code: `
  $let[nation;$spawnConfig[nation]]
  $jsonLoad[catch_names;$getNationInfo[$get[nation];catch_names]]
  $jsonLoad[translations;$getNationInfo[$get[nation];translations]]
  $let[catcher;$spawnConfig[caught_by]]
  $let[caughtin;$spawnConfig[caught_in]]
  $let[spawn_at;$spawnConfig[timestamp]]
  
  $let[msg;$messageReferenceID]
  
  $onlyIf[$get[msg]!=;
    $err[Please reply to the message you want to compare]
  ]
  $let[user;$getMessage[$channelID;$get[msg];authorID]]
  $let[content;$toLowerCase[$getMessage[$channelID;$get[msg];content]]]
  $let[timestamp;$getMessage[$channelID;$get[msg];timestamp]]
  
  $onlyIf[$get[nation]!=;
    $err[No nations have yet spawned in this server]
  ]
  $onlyIf[$get[catcher]!=;
    $err[No one could catch the last nation]
  ]
  $onlyIf[$get[catcher]!=$get[user];
    $err[You can't compare someone by themself]
  ]
  $onlyIf[$or[$arrayIncludes[catch_names;$get[content]];$arrayIncludes[translations;$get[content]]];
    $err[Not even close, the name was wrong]
  ]
  
  $let[catcher_time;$divide[$get[caughtin];1000]]
  $let[user_time;$divide[$sub[$get[timestamp];$get[spawn_at]];1000]]
  
  $sendMessage[$channelID;
  $reply
<@$get[catcher]>: $get[catcher_time]s
<@$get[user]>: $get[user_time]s

-# difference of $sub[$get[user_time];$get[catcher_time]]s
  ]
  `,
});
