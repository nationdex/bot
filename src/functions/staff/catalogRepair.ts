import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'catalogRepair',
  // Startup repair: older versions counted catches under a stray userCollectibles key of the catalog. Moves those counts onto the nations and removes the key. Returns repaired or nothing.
  params: [],
  code: `
  $let[lock;$mutex[acquire;catalog]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[repaired;$js[
    const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
    const stray = Reflect.get(catalog, 'userCollectibles');
    if (!stray) {
      '';
    } else {
      Object.keys(stray).forEach((id) => {
        const nation = Reflect.get(catalog.collectibles || {}, id);
        const caught = Number((Reflect.get(stray, id) || {}).global_caught) || 0;
        if (nation && caught > Number(nation.global_caught || 0)) nation.global_caught = caught;
      });
      Reflect.deleteProperty(catalog, 'userCollectibles');
      JSON.stringify(catalog);
    }
  ]]
  $if[$get[repaired]!=;$setGlobalVar[collectiblesData;$get[repaired]]]
  $!mutex[release;catalog;$get[lock]]
  $return[$if[$get[repaired]!=;repaired;]]
  `,
});
