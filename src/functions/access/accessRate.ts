import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessRate',
  // Counts one access mutation for the user and returns rate once they exceed 20 per minute.
  params: [
    {
      name: 'actor',
      // The acting user id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[lock;$mutex[acquire;ua:$env[actor]]]
  $jsonLoad[ua;$default[$getUserVar[userAccess;$env[actor]];{}]]
  $let[now;$getTimestamp]
  $let[start;$default[$replace[$env[ua;window;start];undefined;];0]]
  $let[count;$default[$replace[$env[ua;window;count];undefined;];0]]
  $if[$sub[$get[now];$get[start]]>60000;
    $let[start;$get[now]]
    $let[count;0]
  ]
  $let[count;$sum[$get[count];1]]
  $!jsonSet[ua;window;{"start":$get[start],"count":$get[count]}]
  $setUserVar[userAccess;$env[ua];$env[actor]]
  $!mutex[release;ua:$env[actor];$get[lock]]
  $return[$if[$get[count]<=20;ok;rate]]
  `,
});
