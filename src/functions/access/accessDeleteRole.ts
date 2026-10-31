import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessDeleteRole',
  // Deletes a role and every grant of it. Returns a status.
  params: [
    {
      name: 'name',
      // The role name
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[actor;$authorID]
  $let[name;$trim[$env[name]]]
  $if[$hasCap[$get[actor];access.manage]==false;$return[denied]]
  $if[$accessRate[$get[actor]]==rate;$return[rate]]
  $if[$get[name]==owner;$return[protected]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[roles;$if[$jsonHas[acc;roles];$env[acc;roles];{}]]
  $let[caps;$if[$jsonHas[roles;$get[name]];$jsonStringify[$env[roles;$get[name]]];]]
  $if[$get[caps]==;$return[missing]]
  $let[verdict;$accessCheck[$accessCaps[$get[actor]];$get[caps]]]
  $if[$get[verdict]!=ok;$return[$get[verdict]]]
  $let[lock;$mutex[acquire;access]]
  $jsonLoad[acc;$accessData]
  $!jsonDelete[acc;roles;$get[name]]
  $jsonLoad[remRoles;$if[$jsonHas[acc;removedRoles];$env[acc;removedRoles];{}]]
  $if[$isArray[remRoles]==false;$arrayCreate[remRoles]]
  $if[$arrayIncludes[remRoles;$get[name]]==false;$!arrayPush[remRoles;$get[name]]]
  $!jsonSet[acc;removedRoles;$env[remRoles]]
  $setGlobalVar[access;$env[acc]]
  $!mutex[release;access;$get[lock]]
  $jsonLoad[rows;$searchDB[userAccess]]
  $arrayForEach[rows;row;
    $let[uid;$env[row;id]]
    $let[rowLock;$mutex[acquire;ua:$get[uid]]]
    $jsonLoad[ua;$getUserVar[userAccess;$get[uid]]]
    $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
    $if[$isArray[grants];
      $arrayFilter[grants;g;$not[$and[$env[g;kind]==role;$env[g;subject]==$get[name]]];filteredGrants]
      $!jsonSet[ua;grants;$env[filteredGrants]]
      $setUserVar[userAccess;$env[ua];$get[uid]]
    ]
    $!mutex[release;ua:$get[uid];$get[rowLock]]
  ]
  $!accessLog[$get[actor];role-delete;;$get[name]]
  $!accessNotify[Role \`$get[name]\` was deleted by \`$fetchUsername[$get[actor]]\`.]
  $return[ok]
  `,
});
