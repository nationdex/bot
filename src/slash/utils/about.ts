import { slashCommand } from '../../config/slash';

export default slashCommand('about', `
  $interactionReply[
    $addContainer[
      $addSection[
        $addTextDisplay[## $appEmoji[info] $jsonVar[config;bot.name]
$jsonVar[config;bot.description]]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addSeparator
      $addTextDisplay[**Stats**
**$collectiblesData[total]** $jsonVar[keywords;collectible.plural] to collect • **$guildCount** servers • **$userCount** users • **$collectiblesData[total_caught]** $jsonVar[keywords;collectible.plural] caught
Version **$jsonVar[config;bot.version]**
Uptime: **$parseMS[$uptime;2]**]
      $addTextDisplay[**Credits**
$appEmoji[crown] **[$jsonVar[config;author.name]\\]($jsonVar[config;author.profile])** Founder
$appEmoji[code] **[$jsonVar[config;dev.name]\\]($jsonVar[config;dev.profile])** Bot Developer
$appEmoji[code] **[$jsonVar[config;webDev.name]\\]($jsonVar[config;webDev.profile])** Web Developer
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
