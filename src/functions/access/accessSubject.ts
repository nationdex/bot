import { ForgeFunction } from '@tryforge/forgescript';
import { accessCapabilities } from '../../config/access';
export default new ForgeFunction({
  name: 'accessSubject',
  // Resolves a role or capability name to {"kind","caps"}, or empty when unknown.
  params: [
    {
      name: 'subject',
      // A role name or a capability
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[acc;$accessData]
  $let[subj;$trim[$env[subject]]]
  $jsonLoad[roles;$if[$jsonHas[acc;roles];$env[acc;roles];{}]]
  $if[$jsonHas[roles;$get[subj]];
    $jsonLoad[res;{}]
    $!jsonSet[res;kind;role]
    $!jsonSet[res;caps;$env[roles;$get[subj]]]
    $return[$env[res]]
  ]
  $arrayLoad[known;,;${accessCapabilities.join(',,')}]
  $let[isCap;$or[
    $get[subj]==*;
    $arrayIncludes[known;$get[subj]];
    $and[$endsWith[$get[subj];.*];$arraySome[known;c;$startsWith[$env[c];$cropText[$get[subj];0;$sub[$charCount[$get[subj]];1]]]]]
  ]]
  $if[$get[isCap];
    $jsonLoad[res;{}]
    $!jsonSet[res;kind;capability]
    $arrayCreate[capArr]
    $!arrayPush[capArr;$get[subj]]
    $!jsonSet[res;caps;$env[capArr]]
    $return[$env[res]]
  ]
  `,
});
