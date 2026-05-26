import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'nationCard',
  // Displays a caught nation's info with its card as a plain message.
  params: [
    {
      name: 'id',
      // ID of the nation whose card to show.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $return[ID: \`#$get[id]\`
Caught on $discordTimestamp[$getNation[$get[id];timestamp];FullDateShortTime] in $divide[$getNation[$get[id];caught_in];1000]s

$appEmoji[sword] ATK: $appEmoji[$getNation[$get[id];attack_type]] $getNation[$get[id];attack]
$appEmoji[heart] HP: $appEmoji[$getNation[$get[id];health_type]] $getNation[$get[id];health]
<card>
    ]
  `,
});
