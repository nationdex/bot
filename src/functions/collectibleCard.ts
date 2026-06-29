import { ForgeFunction } from '@tryforge/forgescript';
import { config } from '../config/config';

export default new ForgeFunction({
  name: 'collectibleCard',
  // Displays a caught collectible's info with its card as a plain message.
  params: [
    {
      name: 'id',
      // ID of the collectible whose card to show.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[colId;$collectible[$get[id];id]]
  $let[bg;${config.cards}/$collectibleInfo[$get[colId];regime].png]
  $let[name;$toUpperCase[$default[$replace[$collectibleInfo[$get[colId];short_name];null;];$collectibleInfo[$get[colId];name]]]]
  $let[economyIcon;${config.icons}/$collectibleInfo[$get[colId];economy].png]
  $let[card;${config.collection_cards}/$collectibleInfo[$get[colId];collection_card]]
  $let[capacity;$collectibleInfo[$get[colId];capacity_name]]
  $let[description;$collectibleInfo[$get[colId];capacity_description]]
  $let[attack;$collectible[$get[id];attack]]
  $let[attack_color;$if[$collectible[$get[id];attack_type]==buffed;#00FF00;#FF0000]]
  $let[health;$collectible[$get[id];health]]
  $let[health_color;$if[$collectible[$get[id];health_type]==buffed;#00FF00;#FF0000]]
  $let[artist;$collectibleInfo[$get[colId];credits]]

  $createCanvas[info;1500;2100]
  $drawImage[info;$get[bg];0;0;1500;2100]
  $drawText[info;fill;$get[name];140px Posterama-Bold;#FFFFFF;70;230]
  $drawImage[info;$get[economyIcon];1255;100;150;150]
  $drawImage[info;$get[card];70;280;1360;730]
  $drawText[info;fill;$get[capacity];90px Roboto-Bold;#FFFFFF;120;1160]
  $drawText[info;fill;$get[description];75px Coolvetica;#EEEEEE;120;1300;1250;true;character]
  $textBaseline[info;middle]
  $drawText[info;fill;$get[health];100px LemonMilk_Bold;$get[health_color];300;1770]
  $drawText[info;fill;$get[attack];100px LemonMilk_Bold;$get[attack_color];1090;1770]
  $drawText[info;fill;Artwork by:\n$get[artist];50px LemonMilk_Regular;#FFFFFF;70;1950;600;true;character]
  
  $return[
ID: \`#$get[id]\`
Caught on $discordTimestamp[$collectible[$get[id];timestamp];FullDateShortTime] in $shortParse[$collectible[$get[id];caught_in];5]

$appEmoji[sword] ATK: $appEmoji[$collectible[$get[id];attack_type]] $collectible[$get[id];attack]
$appEmoji[heart] HP: $appEmoji[$collectible[$get[id];health_type]] $collectible[$get[id];health]
$attachCanvas[info]
  ]
  `,
});
