import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'randomRarity',
  // Returns a random id from the given json based on its "rarity" key value
  params: [
    {
      name: 'data',
      // the json data of values. must be in the following form: { "id": { "rarity": integer } }
      type: 'String',
      required: true,
    },
  ],
  code: `
  $return[$js[const data = $env[data];
    const entries = Object.entries(data);
    const weights = entries.map(([_, val\\]) => val.rarity);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    let result = entries[entries.length - 1\\][0\\];
    
    for (let i = 0; i < entries.length; i++) {
      random -= weights[i\\];
      if (random <= 0) { result = entries[i\\][0\\]; break; }
    }
    
result]]
  `,
});
