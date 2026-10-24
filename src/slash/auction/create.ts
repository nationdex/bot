import { SlashCommand } from '../../core/slashes';
import { auctionConfig } from '../../config/auction';

const durations = auctionConfig.durations.map((d) => d.value).join(',');

export default SlashCommand('auction.create', `
  $let[id;$replace[$option[$jsonVar[keywords;collectible.singular]];#;]]
  $let[start;$round[$option[starting_bid]]]
  $let[minutes;$option[duration]]
  $let[buyout;$round[$default[$option[buyout];0]]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]

  $onlyIf[$arrayIncludes[collectibles;$get[id]];
    $err[invalid_collectible;true]
  ]
  $onlyIf[$get[start]>0;
    $err[min_amount;true]
  ]
  $onlyIf[$or[$get[buyout]==0;$get[buyout]>$get[start]];
    $err[auction_bad_buyout;true]
  ]
  $onlyIf[$checkContains[,${durations},;,$get[minutes],];
    $err[generic;true]
  ]

  $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
  $jsonLoad[listed;$default[$env[house;auctions];{}]]
  $jsonLoad[keys;$jsonKeys[listed]]
  $arrayFilter[keys;key;$and[$env[listed;$env[key];seller]==$authorID;$env[listed;$env[key];ends]>$getTimestamp];mine]
  $let[active;$arrayLength[mine]]
  $onlyIf[$get[active]<${auctionConfig.maxActivePerUser};
    $err[auction_limit;true]
  ]

  $let[token;$auctionLock[acquire]]
  $onlyIf[$get[token]!=;
    $err[auction_busy;true]
  ]
  $let[escrowed;$auctionEscrow[$authorID;$get[id]]]
  $if[$get[escrowed]==true;
    $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
    $if[$jsonHas[house;auctions]!=true;$!jsonSet[house;auctions;{}]]
    $let[aid;$sum[$default[$env[house;seq];0];1]]
    $let[now;$getTimestamp]
    $!jsonSet[house;seq;$get[aid]]
    $!jsonSet[house;auctions;$get[aid];{"id":"$get[aid]","seller":"$authorID","nation":"$get[id]","colID":"$collectible[$get[id];id]","start":$get[start],"buyout":$get[buyout],"bid":0,"bidder":"","bids":0,"created":$get[now],"ends":$sum[$get[now];$multi[$get[minutes];60000]],"guild":"$guildID","channel":"$channelID"}]
    $setGlobalVar[auctionHouse;$env[house]]
    $!auctionStats[$authorID;$get[aid];listed]
  ]
  $!auctionLock[release;$get[token]]
  $onlyIf[$get[escrowed]==true;
    $err[invalid_collectible;true]
  ]

  $interactionReply[
    $addTextDisplay[\`$fetchUsername[$authorID]\` put a $jsonVar[keywords;collectible.singular] up for auction!]
    $auctionView[$get[aid];$authorID;public]
  ]
  $!auctionSettle
`);
