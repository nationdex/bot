import { command } from '../../core/define/commands';

export default command('dev.eval', `
  $onlyIf[$hasCap[$authorID;eval.run;$if[$guildID==;dm;]]]
  $onlyIf[$accessEvalAllowed]
  $let[detail;$evalPrefixCode]
  $if[$get[detail]!=;$!accessLog[$authorID;eval;;$get[detail]]]
`);
