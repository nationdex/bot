import { ForgeFunction } from '@tryforge/forgescript';
import { config } from '../config/config';

export default new ForgeFunction({
  name: 'spawnNation',
  // Spawn a nation with the given properties
  params: [
    {
      name: 'channel',
      // The channel to spawn the nation in
      type: 'String',
      required: true,
    },
    {
      name: 'nation',
      // ID of the nation to spawn, random according to rarity if not specified
      type: 'String',
      required: false,
    },
    {
      name: 'attackBonus',
      // The attack bonus for the nation
      type: 'String',
      required: false,
    },
    {
      name: 'healthBonus',
      // The health bonus for the nation
      type: 'String',
      required: false,
    },
    {
      name: 'class',
      // The rarity class of the nation, random if not specified
      type: 'String',
      required: false,
    },
    {
      name: 'event',
      // The event type of the nation, none if not specified
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[ch;$env[channel]]
  $let[class;$replace[$env[class];null;]]
  
  $jsonLoad[nations;$getNationsData[nations]]
  $jsonLoad[ids;$jsonKeys[nations]]
  $if[$get[class]!=;
    $jsonLoad[classNations;{}]
    $arrayForEach[ids;id;$if[$env[nations;$env[id];class]==$get[class];$!jsonSet[classNations;$env[id];$env[nations;$env[id]]]]]
    $jsonLoad[nations;$env[classNations]]
  ]
  $let[nation;$default[$replace[$env[nation];null;];$randomRarity[$env[nations]]]]
  $let[atck_bns;$default[$replace[$env[attackBonus];null;];$randomText[+;-]$randomNumber[1;20]]]
  $let[hlth_bns;$default[$replace[$env[healthBonus];null;];$randomText[+;-]$randomNumber[1;20]]]
  $let[event;$replace[$env[event];null;]]
  $let[atck;$ceil[$math[$getNationInfo[$get[nation];attack]$cropText[$get[atck_bns];0;1](($getNationInfo[$get[nation];attack]*$cropText[$get[atck_bns];1;4])/100)]]]
  $let[hlth;$ceil[$math[$getNationInfo[$get[nation];health]$cropText[$get[hlth_bns];0;1](($getNationInfo[$get[nation];health]*$cropText[$get[hlth_bns];1;4])/100)]]]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[lastNation;$env[config;nation]]
  $let[message;$sendMessage[$get[ch];
    $attachment[assets/nations/$getNationInfo[$get[nation];wild_card];nation.png]
    $if[$and[$get[lastNation]!=;$spawnConfig[caught_by]==];Looks like no one could catch the $appEmoji[$getNationInfo[$get[lastNation];emoji_id]] **$getNationInfo[$get[lastNation];name]**]
    $title[$if[$spawnConfig[caught_by]==;Another;$if[$getNationInfo[$get[nation];class]==uncommon;An;A]] $appEmoji[$getNationInfo[$get[nation];class]] **$toTitleCase[$getNationInfo[$get[nation];class]]** nation just $randomText[spawned!;dropped!;summoned!;landed!]]
    $image[attachment://nation.png]
    $footer[Type its name in the chat to catch it!]
    $color[${config.color}]
  ;true]]
  
  $!jsonSet[config;caught_by;""]
  $!jsonSet[config;caught_in;""]
  $!jsonSet[config;channel;"$get[ch]"]
  $!jsonSet[config;message;"$get[message]"]
  $!jsonSet[config;nation;$get[nation]]
  $!jsonSet[config;attack;"$get[atck]"]
  $!jsonSet[config;health;"$get[hlth]"]
  $!jsonSet[config;attack_bonus;"$get[atck_bns]"]
  $!jsonSet[config;health_bonus;"$get[hlth_bns]"]
  $!jsonSet[config;timestamp;"$getTimestamp"]
  $!jsonSet[config;event;$get[event]]
  $setGuildVar[spawnConfig;$env[config]]
  `,
});
