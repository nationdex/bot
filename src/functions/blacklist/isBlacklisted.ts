import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'isBlacklisted',
  // Returns whether a user or server is blacklisted.
  params: [
    {
      name: 'type',
      // user or guild
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The user or guild id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $if[$or[$get[id]==;$get[id]==null;$and[$env[type]!=user;$env[type]!=guild]];$return[false]]
  $let[raw;$if[$env[type]==guild;$getGuildVar[blacklist;$get[id]];$getUserVar[blacklist;$get[id]]]]
  $jsonLoad[entry;$default[$get[raw];{}]]
  $return[$checkCondition[$default[$env[entry;timestamp];0]>0]]
  `,
});
