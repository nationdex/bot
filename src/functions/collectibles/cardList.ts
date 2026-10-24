import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'cardList',
  // Lists the card backgrounds in the cards folder as a JSON array of {id, name, file, url, nationsCount}.
  params: [
  ],
  code: `
  $let[dir;$jsonVar[config;paths.cards]]
  $let[catalog;$collectiblesData[collectibles]]
  $return[$js[
    const fs = require('fs');
    const dir = ctx.getKeyword('dir');
    const nations = Object.values(JSON.parse(ctx.getKeyword('catalog') || 'null') || {});
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort() : new Array();
    JSON.stringify(files.map((file) => {
      const id = file.slice(0, -4);
      return {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).split('_').join(' '),
        file,
        url: '/v1/cards/' + encodeURIComponent(id) + '/image',
        nationsCount: nations.filter((n) => n && n.regime === id).length,
      };
    }))
  ]]
  `,
});
