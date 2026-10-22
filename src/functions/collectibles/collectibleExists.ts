import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectibleExists',
  // Checjs if a collectible with the givenn ID string exists
  params: [
    {
      name: 'id',
      // The string to check if it's associated with a collectible
      type: 'String',
      required: true
    }
  ],
  code: `
  $jsonLoad[collectibles;$collectiblesData[collectibles]]
  $jsonLoad[ids;$jsonKeys[collectibles]]
  $return[$if[$arrayIndexOf[ids;$env[id]]!=-1;true;false]]
  `
});
