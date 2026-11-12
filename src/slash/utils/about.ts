import { slashCommand } from '../../core/slashes';

export default slashCommand('about', `
  $jsonLoad[maintainers;$default[$jsonVar[config;maintainers];{}]]
  $jsonLoad[names;$jsonKeys[maintainers]]
  $arrayMap[names;name;$return[**[$replace[$env[name];_; ]\\]($env[maintainers;$env[name]])**];lines]
  $interactionReply[
    $addContainer[
      $addSection[
        $addTextDisplay[## $jsonVar[config;bot.name]
$jsonVar[config;bot.description]]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addSeparator
      $addTextDisplay[**Stats**
**$collectiblesData[total]** $jsonVar[keywords;collectible.plural] to collect • **$guildCount** servers • **$totalPlayers** players • **$collectiblesData[total_caught]** $jsonVar[keywords;collectible.plural] caught
Version **$jsonVar[config;bot.version]**
Uptime: **$parseMS[$uptime;2]**]
      $addTextDisplay[**Maintainers**
$arrayJoin[lines;
]
-# Made with ❤️ using [ForgeScript\\](https://docs.botforge.org/?p=ForgeScript) and its extensions!
]
      
      $addSeparator
      $addActionRow
      $addButton[$jsonVar[config;urls.server];Support;Link]
      $addButton[$botInvite;Invite;Link]
      $addButton[$jsonVar[config;urls.repo];Source Code;Link]
      $addActionRow
      $addButton[$jsonVar[config;urls.terms];ToS;Link]
      $addButton[$jsonVar[config;urls.policy];Privacy Policy;Link]
    ;$jsonVar[config;accent]]
  ]
`);
