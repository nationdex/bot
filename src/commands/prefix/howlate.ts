import { command } from '../../config/commands';

export default command('prefix.howlate', `
  $let[msg;$messageReferenceID]
  
  $onlyIf[$get[msg]!=;
    $err[reply_to_message]
  ]

  $let[ctbl;$spawnConfig[collectible]]
  $jsonLoad[catch_names;$collectibleInfo[$get[ctbl];catch_names]]
  $jsonLoad[translations;$collectibleInfo[$get[ctbl];translations]]
  $let[catcher;$spawnConfig[caught_by]]
  $let[catcher_time;$spawnConfig[caught_in]]
  $let[spawn_at;$spawnConfig[timestamp]]
  $let[user;$getMessage[$channelID;$get[msg];authorID]]
  $let[content;$toLowerCase[$getMessage[$channelID;$get[msg];content]]]
  $let[user_time;$sub[$getMessage[$channelID;$get[msg];timestamp];$get[spawn_at]]]
  
  $onlyIf[$get[ctbl]!=;
    $err[no_spawn]
  ]
  $onlyIf[$get[catcher]!=;
    $err[collectible_not_caught]
  ]
  $onlyIf[$get[catcher]!=$get[user];
    $err[compare_self]
  ]
  $onlyIf[$get[user_time]>0;
    $err[message_sent_early]
  ]
  $onlyIf[$or[$arrayIncludes[catch_names;$get[content]];$arrayIncludes[translations;$get[content]]];
    $err[wrong_collectible]
  ]
  
  $sendMessage[$channelID;
  $reply
<@$get[catcher]>: $shortParse[$get[catcher_time];-1]
<@$get[user]>: $shortParse[$get[user_time];-1]

-# difference of $shortParse[$sub[$get[user_time];$get[catcher_time]];-1]
  ]
`);
