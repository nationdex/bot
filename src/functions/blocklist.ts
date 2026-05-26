import { ForgeFunction } from '@tryforge/forgescript';
import { config } from '../config/config';

export default new ForgeFunction({
  name: 'blocklist',
  // Shows the blocklist of an user as a Components v2 message.
  params: [
    {
      name: 'user',
      // The user whose blocks list to check.
      type: 'String',
      required: false,
    },
    {
      name: 'page',
      // The page number to show.
      type: 'String',
      required: false,
    },
  ],
  brackets: false,
  code: `
  $let[user;$findUser[$env[user];true]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[maxperpage;25]
  $jsonLoad[blocked;$getUserVar[blockedUsers;$get[user]]]
  $let[pages;$ceil[$divide[$arrayLength[blocked];$get[maxperpage]]]]
  $let[stInd;$sub[$get[page];1]]
  $let[endInd;$get[maxperpage]]
  
  $if[$arrayLength[blocked]<1;
    $return[$err[You have not blocked any user;true]]
  ]
  
  $arraySlice[blocked;show;$get[stInd];$get[endInd]]
  $arrayMap[show;user;$return[\`$sum[$arrayIndexOf[blocked;$env[user]];1].\`: [$username[$env[user]]\\](https://discord.com/users/$env[user])];display]
  
  $return[
    $addContainer[
      $addTextDisplay[### Blocked Users
-# $arrayLength[blocked] users blocked]
      $addSeparator
      $addTextDisplay[$arrayJoin[display;
]]
    ;${config.color}]
    $addActionRow
    $addButton[pages-blocklist-$authorID-$sub[$get[page];1]-$get[user];;Secondary;$appEmoji[arrow_left];$checkCondition[$get[page]==1]]
        $addButton[pages-blocklist-$authorID-index;$get[page] / $get[pages];Primary;;true]
        $addButton[pages-blocklist-$authorID-$sum[$get[page];1]-$get[user];;Secondary;$appEmoji[arrow_right];$checkCondition[$get[page]==$get[pages]]]
  ]
  `,
});
