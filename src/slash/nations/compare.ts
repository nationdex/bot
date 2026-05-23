import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { config } from '../../config/config';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'compare',
    description: 'Compare your nations progress with another user',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: 'The user whom you want to compare to',
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: 'Compare the nations of a specific rarity class',
        required: false,
        choices: [
          {
            name: 'Common',
            value: 'common',
          },
          {
            name: 'Uncommon',
            value: 'uncommon',
          },
          {
            name: 'Rare',
            value: 'rare',
          },
          {
            name: 'Mythic',
            value: 'mythic',
          },
          {
            name: 'Legendary',
            value: 'legendary',
          },
        ],
      },
    ],
  },
  code: `
  $let[user;$findUser[$option[user];true]]
  $let[class;$option[class]]
  $jsonLoad[blocked;$getUserVar[blockedUsers;$get[user]]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot collect nations, sadly :(;true]
  ]
  $onlyIf[$get[user]!=$authorID;
    $err[You cannot compare your own nations, run the </nations progress:$applicationCommandID[nations]> command to view your progress;true]
  ]
  $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
    $err[<@$get[user]> have their inventory private;true]
  ]
  $onlyIf[$arrayIncludes[blocked;$authorID]==false;
    $err[Something went wrong;true]
  ]
  
  $jsonLoad[nations;$getUserData[$authorID;unique]]
  $jsonLoad[userNations;$getUserData[$get[user];unique]]
  $jsonLoad[allNations;$getNationsData[nations]]
  $jsonLoad[allIds;$jsonKeys[allNations]]
  
  $arrayMap[nations;nid;$if[$get[class]!=;$if[$getNationInfo[$env[nid];class]==$get[class];$return[$appEmoji[$getNationInfo[$env[nid];emoji_id]]]];$return[$appEmoji[$getNationInfo[$env[nid];emoji_id]]]];nations]
  $arrayMap[userNations;nid;$if[$get[class]!=;$if[$getNationInfo[$env[nid];class]==$get[class];$return[$appEmoji[$getNationInfo[$env[nid];emoji_id]]]];$return[$appEmoji[$getNationInfo[$env[nid];emoji_id]]]];userNations]
    $arrayMap[allIds;nid;$if[$get[class]!=;$if[$getNationInfo[$env[nid];class]==$get[class];$return[$appEmoji[$getNationInfo[$env[nid];emoji_id]]]];$return[$appEmoji[$getNationInfo[$env[nid];emoji_id]]]];allIds]
  $jsonLoad[same;[\\]]
  $arrayForEach[allIds;nid;
    $if[$and[$arrayIncludes[nations;$env[nid]];$arrayIncludes[userNations;$env[nid]]];
      $!jsonSet[same;$arrayLength[same];$env[nid]]
      $!jsonDelete[nations;$arrayIndexOf[nations;$env[nid]]]
      $!jsonDelete[userNations;$arrayIndexOf[userNations;$env[nid]]]
      $!jsonDelete[allIds;$arrayIndexOf[allIds;$env[nid]]]
    ]
  ]
  $let[count;$if[$get[class]!=;$getUserData[$authorID;$get[class]];$getUserData[$authorID;total]]]
  $let[userCount;$if[$get[class]!=;$getUserData[$get[user];$get[class]];$getUserData[$get[user];total]]]
  $let[totalCount;$if[$get[class]!=;$getNationsData[$get[class]];$getNationsData[total]]]
  $let[progress;$math[($get[count]/$get[totalCount])*100]%]
  $let[userProgress;$math[($get[userCount]/$get[totalCount])*100]%]
  
  $interactionReply[
    $addContainer[
      $addSection[
        $addTextDisplay[## Progress Comparision
-# Between **$userDisplayName** and **$userDisplayName[$get[user]]**
Progress of $userDisplayName: **$get[progress]**
Progress of $userDisplayName[$get[user]]: **$get[userProgress]**]
        $addThumbnail[$userAvatar]
      ]
      $addSeparator
      $if[$arrayLength[same]>0;$addTextDisplay[**Both of them have**:
$arrayJoin[same;  ]
      ]]
      $if[$arrayLength[nations]>0;$addTextDisplay[**Only $userDisplayName has**:
$arrayJoin[nations;  ]
      ]]
      $if[$arrayLength[userNations]>0;$addTextDisplay[**Only $userDisplayName[$get[user]] has**:
$arrayJoin[userNations;  ]
      ]]
      $if[$arrayLength[allIds]>0;$$addTextDisplay[**None of them have**:
$arrayJoin[allIds;  ]
      ]]
    ;${config.color}]
  ]
  `,
});
