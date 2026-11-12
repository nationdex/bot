import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'randomRarity',
  // Returns a random ID from the given JSON based on its "rarity" key value.
  params: [
    {
      name: 'data',
      // The JSON data of values. Must be in the following form: { "id": { "rarity": integer } }
      type: 'String',
      required: true,
    },
  ],
  code: `
  $if[$isJSON[$env[data]];
  $return[$js[const data = $env[data];
    if (data == null || typeof data !== "object" || Array.isArray(data) || Object.keys(data).length === 0) { "" }
    else {
    const entries = Object.entries(data);
    const weights = entries.map(([_, val\\]) => val != null && val.rarity != null ? val.rarity : 0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    if (totalWeight <= 0) { "" }
    else {
    let random = Math.random() * totalWeight;
    let result = entries[entries.length - 1\\][0\\];
    
    for (let i = 0; i < entries.length; i++) {
      random -= weights[i\\];
      if (random <= 0) { result = entries[i\\][0\\]; break; }
    }
    
    result } }]]
  ;$return[$env[data]]]
  `,
});
