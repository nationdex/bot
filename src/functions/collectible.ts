import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: `collectible`,
  /// Get info of a collectible that has been caught and is available in a user's inventory or auction house from the "collectible" variable.
  params: [
    {
      name: 'id',
      /// ID of the collectible.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      /// The value to get.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[data;$getVar[collectible;$env[id]]]
  $return[$env[data;$env[value]]]
  `,
});
