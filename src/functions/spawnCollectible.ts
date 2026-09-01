import { ForgeFunction } from '@tryforge/forgescript';

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
      // The special type of the collectible, none if not specified.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[ch;$env[channel]]
  $jsonLoad[collectibles;$collectiblesData[collectibles]]
  $jsonLoad[ids;$collectibleIDs[;$env[class]]]

  $onlyIf[$channelExists[$get[ch]]]
  $onlyIf[$channelHasPerms[$get[ch];$botID;ViewChannel;SendMessages;EmbedLinks;AttachFiles]]
  $onlyIf[$arrayLength[ids]>0]

  $let[ctbl;$default[$replace[$env[collectibleID];null;];$randomRarity[$env[collectibles]]]]
  $let[wildPath;$jsonVar[config;paths.wild_cards]/$collectibleInfo[$get[ctbl];wild_card]]

  $onlyIf[$fileExists[$get[wildPath]]]

  $let[atck_bns;$default[$replace[$env[attackBonus];null;];$randomText[+;-]$randomNumber[0;20]]]
  $let[hlth_bns;$default[$replace[$env[healthBonus];null;];$randomText[+;-]$randomNumber[0;20]]]
  $let[atck;$ceil[$math[$collectibleInfo[$get[ctbl];attack]$cropText[$get[atck_bns];0;1](($collectibleInfo[$get[ctbl];attack]*$cropText[$get[atck_bns];1;4])/100)]]]
  $let[hlth;$ceil[$math[$collectibleInfo[$get[ctbl];health]$cropText[$get[hlth_bns];0;1](($collectibleInfo[$get[ctbl];health]*$cropText[$get[hlth_bns];1;4])/100)]]]
  $let[special;$replace[$env[special];null;]]
  $let[lastCaught;$and[$spawnConfig[collectible]!=;$spawnConfig[caught_by]!=]]

  $let[message;$sendMessage[$get[ch];
    $if[$get[lastCaught]==false;It looks like no one caught the $appEmoji[$collectibleInfo[$get[lastCollectible];emoji_id]] **$collectibleInfo[$get[lastCollectible];name]**]
    $attachment[$get[wildPath];wild_$jsonVar[keywords;collectible.singular].png]
    $title[$if[$get[lastCaught]==false;Another;A] wild $jsonVar[keywords;collectible.singular] just $randomText[spawned!;dropped!;summoned!;landed!;exploded!;appeared!;crashed!]]
    $image[attachment://wild_$jsonVar[keywords;collectible.singular].png]
    $footer[Type its name in the chat to catch it!]
    $color[$jsonVar[config;accent]]
  ;true]]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $!jsonSet[config;caught_by;""]
  $!jsonSet[config;caught_in;""]
  $!jsonSet[config;channel;"$get[ch]"]
  $!jsonSet[config;message;"$get[message]"]
  $!jsonSet[config;collectible;$get[ctbl]]
  $!jsonSet[config;attack_bonus;$get[atck_bns]]
  $!jsonSet[config;health_bonus;$get[hlth_bns]]
  $!jsonSet[config;attack;$get[atck]]
  $!jsonSet[config;health;$get[hlth]]
  $!jsonSet[config;timestamp;"$getTimestamp"]
  $!jsonSet[config;special;$get[special]]
  $setGuildVar[spawnConfig;$env[config]]
  `,
});
