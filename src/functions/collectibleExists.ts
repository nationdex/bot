import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectibleExists',
  // Checjs if a collectible with the givenn ID string exists
  params: [
    {
      name: 'ID',
      // The string to check if it's associated with a collectible
      type: 'String',
      required: true
    }
  ],
  code: `
  $jsonLoad[ids;$collectiblesData[id]]
  $return[$arrayIncludes[ids;$env[id]]]
  `
});
