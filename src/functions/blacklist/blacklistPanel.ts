import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistPanel',
  // Blacklist list panel: type switcher, page of bullets, entry picker and pagination.
  params: [
    {
      name: 'type',
      // user or guild.
      type: 'String',
      required: true,
    },
    {
      name: 'page',
      // The page number.
      type: 'String',
      required: false,
    },
    {
      name: 'owner',
      // The staff member who owns the panel.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[owner;$env[owner]]
  $jsonLoad[pg;$blacklistPage[$if[$env[type]==guild;guild;user];$env[page];10]]
  $let[type;$env[pg;type]]
  $let[page;$env[pg;page]]
  $let[pages;$env[pg;pages]]
  $jsonLoad[items;$env[pg;items]]

  $addContainer[
    $addTextDisplay[## Blacklist
-# $if[$get[type]==user;Users;Servers] · $env[pg;total] total · page $get[page] / $get[pages]]
    $addSeparator
    $addTextDisplay[$env[pg;body]]
  ;$jsonVar[config;accent]]

  $addActionRow
  $addStringSelectMenu[blacklist-type-$get[owner];Switch between users and servers]
  $addOption[Users ($blacklistCount[user]);Blacklisted users;user;;$checkCondition[$get[type]==user]]
  $addOption[Servers ($blacklistCount[guild]);Blacklisted servers;guild;;$checkCondition[$get[type]==guild]]

  $if[$arrayLength[items]>0;
    $addActionRow
    $addStringSelectMenu[blacklist-pick-$get[owner]-$get[type]-$get[page];Select an entry]
    $arrayForEach[items;it;
      $addOption[$env[it;label];$env[it;description];$env[it;id]]
    ]
  ]

  $addActionRow
  $addButton[blacklist-page-$get[owner]-$get[type]-$sub[$get[page];1];Previous;Secondary;;$checkCondition[$get[page]<=1]]
  $addButton[blacklist-page-$get[owner]-index;$get[page] / $get[pages];Primary;;true]
  $addButton[blacklist-page-$get[owner]-$get[type]-$sum[$get[page];1];Next;Secondary;;$checkCondition[$get[page]>=$get[pages]]]
  `,
});
