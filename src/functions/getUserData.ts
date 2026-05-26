import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'getUserData',
  // Get info about a user's nations from the "nations" variable.
  params: [
    {
      name: 'user',
      // The user whose nations' data to get.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value/info to retrieve, leave blank to get json data.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[data;$getUserVar[nations;$env[user]]]
  $return[$env[data;$env[value]]]
  `,
});
