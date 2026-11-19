import { ForgeFunction } from "@tryforge/forgescript";

export default new ForgeFunction({
  name: 'shortParse',
  // Parse the given milliseconds into a short string (e.g., 1000ms -> 1s, 59890ms -> 59.89s)
  params: [
    {
      name: 'ms',
      // The milliseconds to parse
      type: 'String',
      required: true,
    },
    {
      name: 'decimals',
      // The decimal length (use -1 for no limit).
      type: 'String',
      required: false,
    },
  ],
  code: `
  $onlyIf[$isInteger[$env[ms]]]
  $let[ms;$env[ms]]
  $let[dec;$default[$replace[$env[decimals];null;];0]]
  $let[abs;$abs[$get[ms]]]
  $let[unit;$if[$get[abs]>=86400000;86400000;$if[$get[abs]>=3600000;3600000;$if[$get[abs]>=60000;60000;$if[$get[abs]>=1000;1000;1]]]]]
  $let[label;$if[$get[unit]==86400000;d;$if[$get[unit]==3600000;h;$if[$get[unit]==60000;m;$if[$get[unit]==1000;s;ms]]]]]
  $if[$get[unit]==1;$return[$get[ms]ms]]
  $if[$get[dec]==-1;$return[$math[$get[ms]/$get[unit]]$get[label]]]
  $return[$round[$math[$get[ms]/$get[unit]];$get[dec]]$get[label]]
  `
});
