import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessLog',
  // Appends an entry to the access audit log (newest first, capped at 300).
  params: [
    {
      name: 'actor',
      // The acting user id
      type: 'String',
      required: true,
    },
    {
      name: 'action',
      // The action name
      type: 'String',
      required: true,
    },
    {
      name: 'target',
      // The target id
      type: 'String',
      required: false,
    },
    {
      name: 'detail',
      // Free text detail
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[lock;$mutex[acquire;audit]]
  $let[rawLog;$getGlobalVar[accessAudit]]
  $jsonLoad[list;$if[$get[rawLog]!=;$get[rawLog];{}]]
  $if[$isArray[list]==false;$arrayCreate[list]]
  $jsonLoad[entry;{}]
  $!jsonSet[entry;actor;$cropText[$if[$env[actor]!=null;$env[actor];];0;300]]
  $!jsonSet[entry;action;$cropText[$if[$env[action]!=null;$env[action];];0;300]]
  $!jsonSet[entry;target;$cropText[$if[$env[target]!=null;$env[target];];0;300]]
  $!jsonSet[entry;detail;$cropText[$if[$env[detail]!=null;$env[detail];];0;300]]
  $!jsonSet[entry;at;$getTimestamp]
  $!arrayUnshiftJSON[list;$env[entry]]
  $if[$arrayLength[list]>300;
    $!arraySlice[list;list;0;300]
  ]
  $setGlobalVar[accessAudit;$env[list]]
  $!mutex[release;audit;$get[lock]]
  `,
});
