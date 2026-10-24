import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'spawnPool',
  // The catalog entries that can spawn: those with wild artwork set. Returns them as JSON keyed by id.
  params: [],
  code: `
  $jsonLoad[all;$collectiblesData[collectibles]]
  $jsonLoad[ids;$jsonKeys[all]]
  $arrayFilter[ids;id;$replace[$env[all;$env[id];wild_card];undefined;]!=;wild]
  $jsonLoad[pool;{}]
  $arrayForEach[wild;id;$!jsonSet[pool;$env[id];$env[all;$env[id]]]]
  $return[$env[pool]]
  `,
});
