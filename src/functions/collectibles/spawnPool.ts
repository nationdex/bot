import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'spawnPool',
  // The catalog entries that can spawn: those with wild artwork set. Returns them as JSON keyed by id.
  params: [],
  code: `
  $let[all;$collectiblesData[collectibles]]
  $return[$js[
    const all = JSON.parse(ctx.getKeyword('all') || 'null') || {};
    const pool = {};
    Object.keys(all).forEach((id) => {
      const c = Reflect.get(all, id);
      if (c && c.wild_card) Reflect.set(pool, id, c);
    });
    JSON.stringify(pool)
  ]]
  `,
});
