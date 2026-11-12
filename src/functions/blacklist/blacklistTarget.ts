import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistTarget',
  // Resolves exactly one of a user id or a numeric server id: type is user, guild, none or invalid.
  params: [
    {
      name: 'user',
      // The user option
      type: 'String',
      required: false,
    },
    {
      name: 'guild',
      // The guild id option
      type: 'String',
      required: false,
    },
    {
      name: 'part',
      // type or id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[u;$trim[$if[$and[$env[user]!=;$env[user]!=null];$env[user];]]]
  $let[g;$trim[$if[$and[$env[guild]!=;$env[guild]!=null];$env[guild];]]]
  $let[id;$if[$get[u]!=;$get[u];$get[g]]]
  $let[numeric;$and[$charCount[$get[id]]>14;$charCount[$get[id]]<26;$isInteger[$get[id]]]]
  $let[type;none]
  $if[$and[$get[u]!=;$get[g]!=];
    $let[type;invalid]
  ;$elseIf[$or[$get[u]!=;$get[g]!=];
    $let[type;$if[$get[numeric];$if[$get[u]!=;user;guild];invalid]]
  ]]
  $if[$env[part]==id;
    $return[$if[$or[$get[type]==user;$get[type]==guild];$get[id];]]
  ;
    $return[$get[type]]
  ]
  `,
});
