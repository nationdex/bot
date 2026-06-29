import { ForgeFunction } from '@tryforge/forgescript';
import { ctbl } from '../config/collectible';
import { config } from '../config/config';

export default new ForgeFunction({
  name: 'spawnCollectible',
  // Spawn a collectible with the given properties.
  params: [
    {
      name: 'channel',
      // The channel to spawn the collectible in.
      type: 'String',
      required: true,
    },
    {
      name: 'collectibleID',
      // ID of the collectible to spawn, random according to rarity if not specified.
      type: 'String',
      required: false,
    },
    {
      name: 'attackBonus',
      // The attack bonus for the collectible.
      type: 'String',
      required: false,
    },
    {
      name: 'healthBonus',
      // The health bonus for the collectible.
      type: 'String',
      required: false,
    },
    {
      name: 'class',
      // The rarity class of the collectible, random if not specified.
      type: 'String',
      required: false,
    },
    {
      name: 'special',
      // The special type of the collectible, none if not specified
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[ch;$env[channel]]
  $let[class;$replace[$env[class];null;]]
  
  $jsonLoad[collectibles;$collectiblesData[collectibles]]
  $jsonLoad[ids;$jsonKeys[collectibles]]
  $if[$get[class]!=;
    $jsonLoad[classCollectibles;{}]
    $arrayForEach[ids;id;$if[$env[collectibles;$env[id];class]==$get[class];$!jsonSet[classCollectibles;$env[id];$env[collectibles;$env[id]]]]]
    $jsonLoad[collectibles;$env[classCollectibles]]
  ]
  $let[ctbl;$default[$replace[$env[collectibleID];null;];$randomRarity[$env[collectibles]]]]
  $let[atck_bns;$default[$replace[$env[attackBonus];null;];$randomText[+;-]$randomNumber[1;20]]]
  $let[hlth_bns;$default[$replace[$env[healthBonus];null;];$randomText[+;-]$randomNumber[1;20]]]
  $let[special;$replace[$env[special];null;]]
  $let[atck;$ceil[$math[$collectibleInfo[$get[ctbl];attack]$cropText[$get[atck_bns];0;1](($collectibleInfo[$get[ctbl];attack]*$cropText[$get[atck_bns];1;4])/100)]]]
  $let[hlth;$ceil[$math[$collectibleInfo[$get[ctbl];health]$cropText[$get[hlth_bns];0;1](($collectibleInfo[$get[ctbl];health]*$cropText[$get[hlth_bns];1;4])/100)]]]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[lastCollectible;$env[config;collectible]]
  $let[message;$sendMessage[$get[ch];
    $attachment[${config.spawn_arts}/$collectibleInfo[$get[ctbl];wild_card];collectible.png]
    $if[$and[$get[lastCollectible]!=;$spawnConfig[caught_by]==];Looks like no one could catch the $appEmoji[$collectibleInfo[$get[lastCollectible];emoji_id]] **$collectibleInfo[$get[lastCollectible];name]**]
    $title[$if[$spawnConfig[caught_by]==;Another;A] wild ${ctbl.singular} just $randomText[spawned!;dropped!;summoned!;landed!;exploded!;appeared!]]
    $image[attachment://collectible.png]
    $footer[Type its name in the chat to catch it!]
    $color[${config.color}]
  ;true]]
  
  $!jsonSet[config;caught_by;""]
  $!jsonSet[config;caught_in;""]
  $!jsonSet[config;channel;"$get[ch]"]
  $!jsonSet[config;message;"$get[message]"]
  $!jsonSet[config;collectible;$get[ctbl]]
  $!jsonSet[config;attack;$get[atck]]
  $!jsonSet[config;health;$get[hlth]]
  $!jsonSet[config;attack_bonus;$get[atck_bns]]
  $!jsonSet[config;health_bonus;$get[hlth_bns]]
  $!jsonSet[config;timestamp;"$getTimestamp"]
  $!jsonSet[config;special;$get[special]]
  $setGuildVar[spawnConfig;$env[config]]
  `,
});
