import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'getNation',
  // Get info of a nation that has been caught and is available in a user's inventory or auction house from the "nation" variable.
  params: [
    {
      name: 'id',
      // ID of the nation.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value to get.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[data;$getVar[nation;$env[id]]]
  $return[$env[data;$env[value]]]
  `,
});
