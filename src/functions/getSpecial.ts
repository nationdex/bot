import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'getSpecial',
  // Get information about an special from the "specials" variable
  params: [
    {
      name: 'name',
      // name of the special
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // Value or info to retrieve.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[ev;$env[name]]
  $let[val;$env[value]]
  
  $jsonLoad[specials;$getGlobalVar[specials]]
  $jsonLoad[special;$env[specials;$get[ev]]]
  
  $return[$if[$get[val]!=;$env[special;$get[val]];$env[special]]]
  `,
});
