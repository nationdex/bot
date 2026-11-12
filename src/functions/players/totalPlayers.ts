import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'totalPlayers',
  // Count of unique users who have caught at least one collectible.
  params: [],
  code: `
  $jsonLoad[rows;$searchDB[userCollectibles;;user]]
  $return[$arrayLength[rows]]
  `,
});
