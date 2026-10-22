import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistDetailView',
  // Detail of one blacklist target: status, recent history, remove and back buttons.
  params: [
    {
      name: 'type',
      // user or guild.
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The user or guild id.
      type: 'String',
      required: true,
    },
    {
      name: 'owner',
      // The staff member who owns the panel.
      type: 'String',
      required: true,
    },
    {
      name: 'page',
      // The list page that Back returns to.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[owner;$env[owner]]
  $let[type;$if[$env[type]==guild;guild;user]]
  $let[id;$env[id]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $jsonLoad[d;$blacklistEntry[$get[type];$get[id]]]

  $addContainer[
    $addTextDisplay[$env[d;title]
$env[d;status]]
    $addSeparator
    $addTextDisplay[### History
$env[d;history]]
  ;$jsonVar[config;accent]]

  $addActionRow
  $if[$env[d;blacklisted];
    $addButton[blacklist-remove-$get[owner]-$get[type]-$get[id]-$get[page];Remove from blacklist;Danger]
  ]
  $addButton[blacklist-back-$get[owner]-$get[type]-$get[page];Back;Secondary]
  `,
});
