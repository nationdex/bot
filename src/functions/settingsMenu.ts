import { ctbl } from '../config/collectible';
import { ForgeFunction } from '@tryforge/forgescript';
import { config } from '../config/config';

export default new ForgeFunction({
  name: 'settingsMenu',
  // Shows the settings menu of a user as a Components v2 message.
  params: [
    {
      name: 'user',
      // The user whose settings to get.
      type: 'String',
      required: false,
    },
  ],
  brackets: false,
  code: `
  $let[user;$findUser[$env[user];true]]
  $let[inv;$userSettings[$authorID;inventory_privacy]]
  $let[profile;$userSettings[$authorID;profile_privacy]]
  $let[gifts;$userSettings[$authorID;accept_gifts]]
  
  $return[
    $addContainer[
      $addSection[
        $addTextDisplay[### $appEmoji[setting] Player Settings
Customize your interaction with other players]
        $addThumbnail[$userAvatar]
      ]
      $addSeparator
      $addSection[
        $addTextDisplay[**Inventory Privacy**:
Choose whether people can view your inventory or not]
        $addButton[settings-inventory_privacy-$authorID-$if[$get[inv]==private;public;private];$toTitleCase[$get[inv]];$if[$get[inv]==private;Secondary;Primary]]
      ]
      $addSeparator
      $addSection[
        $addTextDisplay[**Profile Privacy**:
Choose whether people can view your profile or not]
        $addButton[settings-profile_privacy-$authorID-$if[$get[profile]==private;public;private];$toTitleCase[$get[profile]];$if[$get[profile]==private;Secondary;Primary]]
      ]
      $addSeparator
      $addSection[
        $addTextDisplay[**Accept Gifts?**:
Choose whether you accept ${ctbl.plural} as a gift]
        $addButton[settings-accept_gifts-$authorID-$if[$get[gifts];false;true];$if[$get[gifts];Yes;No];$if[$get[gifts];Primary;Secondary]]
      ]
      $addSeparator
      $addTextDisplay[Made with 💙 by NationDex™ Team]
    ;${config.color}]
  ]
  `,
});
