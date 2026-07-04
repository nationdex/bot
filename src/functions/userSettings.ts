import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'userSettings',
  // Get a user's settings from the "settings" variable.
  params: [
    {
      name: 'user',
      // The user whose settings to get.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value to retrieve.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[data;$getUserVar[settings;$env[user]]]
  $return[$env[data;$env[value]]]
  `,
});
