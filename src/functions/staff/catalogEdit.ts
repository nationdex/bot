import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'catalogEdit',
  // Applies one validated catalog edit (nations, categories, card backgrounds) and returns {status,error,value} as JSON.
  params: [
    {
      name: 'op',
      // nationAdd, nationEdit, nationCategory, nationCard, nationArt, categoryAdd, categoryDelete, backgroundAdd, backgroundReplace or backgroundDelete
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      // The nation id, category or background name
      type: 'String',
      required: false,
    },
    {
      name: 'body',
      // The JSON request body
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[emojiIn;$js[(() => {
    try {
      const b = JSON.parse(String(ctx.getEnvironmentKey('body') ?? '').replace(/^null$/, '') || 'null') || {};
      const op = String(ctx.getEnvironmentKey('op'));
      if (!new Array('nationAdd', 'nationEdit').includes(op) || b.emoji_id === undefined) return '';
      const em = String(b.emoji_id).trim();
      if (!em) return '';
      if (op === 'nationEdit') {
        const id = String(ctx.getEnvironmentKey('id') ?? '').replace(/^null$/, '');
        const cat = JSON.parse(String(ctx.getKeyword('catalog') ?? '') || 'null') || {};
        const cur = Reflect.get(cat.collectibles || {}, id);
        if (cur && String(cur.emoji_id).trim() === em) return '';
      }
      return em;
    } catch (e) {
      return '';
    }
  })()]]
  $if[$get[emojiIn]!=;
    $let[emojiState;$emojiExists[$get[emojiIn]]]
    $if[$get[emojiState]==false;$return[{"status":400,"error":"No application emoji matches that emoji_id. Upload the nation emoji to the application first."}]]
    $if[$get[emojiState]==unverified;$return[{"status":503,"error":"The application emojis could not be checked with Discord right now. Try again in a moment."}]]
  ]
  $let[lock;$mutex[acquire;catalog]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[specials;$getGlobalVar[specials]]
  $let[cardsDir;$jsonVar[config;paths.cards]]
  $let[iconsDir;$jsonVar[config;paths.icons]]
  $let[spawnDir;$jsonVar[config;paths.spawn_art]]
  $let[windowDir;$jsonVar[config;paths.window_art]]
  $let[result;$js[(() => {
    const fs = require('fs');
    const path = require('path');
    const kw = (k) => String(ctx.getKeyword(k) ?? '');
    const op = String(ctx.getEnvironmentKey('op'));
    const id = String(ctx.getEnvironmentKey('id') ?? '').replace(/^null$/, '');
    const bodyText = String(ctx.getEnvironmentKey('body') ?? '').replace(/^null$/, '');
    const err = (status, error) => JSON.stringify({ status: status, error: error });
    let body = {};
    if (bodyText.trim()) {
      try { body = JSON.parse(bodyText); } catch (e) { return err(400, 'The body is not valid JSON.'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return err(400, 'The body must be a JSON object.');
    }
    const catalog = JSON.parse(kw('catalog') || 'null') || {};
    catalog.collectibles = catalog.collectibles || {};
    catalog.classes = catalog.classes || new Array();
    const collectibles = catalog.collectibles;
    const classes = catalog.classes;
    const listPng = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).map((f) => f.slice(0, -4)).sort() : new Array();
    const listIcons = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => new Array('.png', '.jpg', '.jpeg', '.webp').some((e) => f.toLowerCase().endsWith(e))).sort() : new Array();
    const done = (value, extra) => JSON.stringify(Object.assign({ status: 200, value: value, catalog: catalog }, extra || {}));
    const fields = {
      name: { kind: 'text', max: 80, label: 'Name' },
      short_name: { kind: 'text', max: 48, optional: true, label: 'Short name' },
      emoji_id: { kind: 'text', max: 64, label: 'Emoji' },
      credits: { kind: 'text', max: 120, optional: true, label: 'Credit' },
      attack: { kind: 'int', min: 0, label: 'Power' },
      health: { kind: 'int', min: 0, label: 'Health' },
      rarity: { kind: 'number', min: 0.0001, label: 'Spawn weight' },
      weight: { kind: 'number', min: 0.0001, optional: true, label: 'Spawn weight' },
      price: { kind: 'int', min: 0, label: 'Buy price' },
      sell_price: { kind: 'int', min: 0, label: 'Sell price' },
      capacity_name: { kind: 'text', max: 64, optional: true, label: 'Capacity name' },
      capacity_description: { kind: 'text', max: 600, optional: true, label: 'Description' },
      catch_names: { kind: 'list', max: 300, label: 'Catch names' },
      catching_names: { kind: 'list', max: 300, optional: true, label: 'Catch names' },
      translations: { kind: 'list', max: 300, optional: true, label: 'Translations' },
      global_caught: { kind: 'int', min: 0, optional: true, label: 'Global caught' },
    };
    const coerce = (key, raw) => {
      const f = Reflect.get(fields, key);
      if (!f) return { error: 'Unknown field: ' + key };
      if (raw === null || raw === undefined) {
        return f.optional ? { value: f.kind === 'list' ? new Array() : f.kind === 'int' || f.kind === 'number' ? 0 : '' } : { error: f.label + ' is required.' };
      }
      if (f.kind === 'list') {
        let items = new Array();
        if (Array.isArray(raw)) {
          items = raw.map((x) => String(x ?? '').trim().toLowerCase()).filter((x) => x);
        } else {
          items = String(raw).split(',').map((x) => x.trim().toLowerCase()).filter((x) => x);
        }
        if (!items.length) {
          return f.optional ? { value: new Array() } : { error: f.label + ' is required.' };
        }
        return { value: Array.from(new Set(items)) };
      }
      const v = String(raw).trim();
      if (!v) {
        return f.optional ? { value: f.kind === 'list' ? new Array() : f.kind === 'int' || f.kind === 'number' ? 0 : '' } : { error: f.label + ' is required.' };
      }
      if (f.kind === 'int') {
        if (!v.split('').every((c) => c >= '0' && c <= '9')) return { error: f.label + ' must be a whole number.' };
        const n = parseInt(v, 10);
        if (n < f.min) return { error: f.label + ' must be at least ' + f.min + '.' };
        if (n > 999999999) return { error: f.label + ' is too large.' };
        return { value: n };
      }
      if (f.kind === 'number') {
        const n = parseFloat(v);
        if (isNaN(n) || !Number.isFinite(n)) return { error: f.label + ' must be a valid number.' };
        if (n < f.min) return { error: f.label + ' must be at least ' + f.min + '.' };
        if (n > 999999999) return { error: f.label + ' is too large.' };
        return { value: n };
      }
      if (v.length > f.max) return { error: f.label + ' is too long (' + f.max + ' characters max).' };
      return { value: v };
    };
    const clash = (names, own) => {
      let found = '';
      Object.keys(collectibles).filter((k) => k !== own).forEach((k) => {
        const c = Reflect.get(collectibles, k);
        const taken = new Set((c.catch_names || new Array()).concat(c.translations || new Array()).map((a) => String(a).toLowerCase()));
        const hit = names.find((n) => taken.has(n));
        if (hit && !found) found = 'The catch name ' + hit + ' is already used by #' + k + '.';
      });
      return found;
    };
    const nameTaken = (name, own) => Object.keys(collectibles).some((k) => k !== own && String(Reflect.get(collectibles, k).name || '').toLowerCase() === name.toLowerCase());
    const nation = Reflect.get(collectibles, id);
    const plainName = (n) => n.length > 0 && n.length <= 80 && !n.includes('/') && !n.includes(String.fromCharCode(92)) && !n.startsWith('.') && !n.includes('..');
    const artExists = (dir, n) => plainName(n) && fs.existsSync(path.join(dir, n));
    const artKeys = new Array('wild_card', 'collection_card');
    const artDir = (key) => key === 'wild_card' ? kw('spawnDir') : kw('windowDir');
    const artProblem = (src) => {
      for (const key of artKeys) {
        const v = Reflect.get(src, key);
        if (v === undefined || v === '') continue;
        if (nation && String(v) === String(Reflect.get(nation, key))) continue;
        if (!artExists(artDir(key), String(v))) return 'No such artwork file for ' + key + ': ' + v;
      }
      return '';
    };

    if (op === 'nationAdd') {
      const values = {};
      for (const key of new Array('name', 'emoji_id', 'attack', 'health', 'rarity')) {
        const r = coerce(key, key === 'rarity' && body.rarity === undefined ? (body.weight !== undefined ? body.weight : '10') : Reflect.get(body, key));
        if (r.error) return err(400, r.error);
        Reflect.set(values, key, r.value);
      }
      const cls = String(body.class ?? '');
      if (!classes.includes(cls)) return err(400, 'Unknown category: ' + cls);
      if (nameTaken(values.name, '')) return err(400, 'A nation named ' + values.name + ' already exists.');
      const lower = values.name.toLowerCase();
      const catchList = Array.isArray(body.catch_names) ? body.catch_names.map((x) => String(x).trim().toLowerCase()).filter(Boolean) : (Array.isArray(body.catching_names) ? body.catching_names.map((x) => String(x).trim().toLowerCase()).filter(Boolean) : new Array(lower));
      const transList = Array.isArray(body.translations) ? body.translations.map((x) => String(x).trim().toLowerCase()).filter(Boolean) : new Array();
      const taken = clash(catchList.concat(transList), '');
      if (taken) return err(400, taken);
      const artIssue = artProblem(body);
      if (artIssue) return err(400, artIssue);
      const nextId = String(Object.keys(collectibles).map((k) => parseInt(k, 10)).filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0) + 1);
      let reg = String(body.regime ?? '').trim();
      if (reg.toLowerCase().endsWith('.png')) reg = reg.slice(0, -4);
      if (!reg || !listPng(kw('cardsDir')).includes(reg)) reg = listPng(kw('cardsDir')).at(0) || '';
      let econ = String(body.economy ?? '').trim();
      const availableIcons = listIcons(kw('iconsDir'));
      if (!availableIcons.includes(econ)) {
        const matched = availableIcons.find((f) => f.slice(0, f.lastIndexOf('.')).toLowerCase() === econ.toLowerCase());
        econ = matched || (availableIcons.at(0) || '');
      }
      Reflect.set(collectibles, nextId, {
        class: cls,
        rarity: values.rarity,
        weight: values.rarity,
        name: values.name,
        short_name: body.short_name ? String(body.short_name).trim() : null,
        regime: reg,
        economy: econ,
        collection_card: String(body.collection_card ?? ''),
        wild_card: String(body.wild_card ?? ''),
        capacity_name: String(body.capacity_name ?? '').trim(),
        capacity_description: String(body.capacity_description ?? '').trim(),
        credits: String(body.credits ?? '').trim(),
        attack: values.attack,
        health: values.health,
        emoji_id: values.emoji_id,
        translations: Array.from(new Set(transList)),
        catch_names: Array.from(new Set(catchList)),
        catching_names: Array.from(new Set(catchList)),
        global_caught: typeof body.global_caught === 'number' ? Math.max(0, Math.floor(body.global_caught)) : 0,
        price: typeof body.price === 'number' ? Math.max(0, Math.floor(body.price)) : 0,
        sell_price: typeof body.sell_price === 'number' ? Math.max(0, Math.floor(body.sell_price)) : 0
      });
      catalog.total = Object.keys(collectibles).length;
      Reflect.set(catalog, cls, (Number(Reflect.get(catalog, cls)) || 0) + 1);
      return done({ id: nextId });
    }
    if (op === 'nationEdit' || op === 'nationCategory' || op === 'nationCard') {
      if (!nation) return err(400, 'That nation no longer exists.');
    }
    if (op === 'nationEdit') {
      const patch = {};
      let classChanged = false;
      if (body.class !== undefined) {
        const cls = String(body.class ?? '').trim();
        if (!classes.includes(cls)) return err(400, 'Unknown category: ' + cls);
        if (cls !== nation.class) {
          Reflect.set(catalog, nation.class, Math.max((Number(Reflect.get(catalog, nation.class)) || 0) - 1, 0));
          Reflect.set(catalog, cls, (Number(Reflect.get(catalog, cls)) || 0) + 1);
          nation.class = cls;
          classChanged = true;
        }
      }
      if (body.regime !== undefined) {
        let reg = String(body.regime ?? '').trim();
        if (reg.toLowerCase().endsWith('.png')) reg = reg.slice(0, -4);
        if (!listPng(kw('cardsDir')).includes(reg)) return err(400, 'No such card background: ' + body.regime);
        Reflect.set(patch, 'regime', reg);
      }
      if (body.economy !== undefined) {
        let econ = String(body.economy ?? '').trim();
        const availableIcons = listIcons(kw('iconsDir'));
        if (!availableIcons.includes(econ)) {
          const matched = availableIcons.find((f) => f.slice(0, f.lastIndexOf('.')).toLowerCase() === econ.toLowerCase());
          if (matched) econ = matched;
          else return err(400, 'No such icon: ' + body.economy);
        }
        Reflect.set(patch, 'economy', econ);
      }
      for (const key of Object.keys(fields)) {
        if (!(key in body)) continue;
        const r = coerce(key, Reflect.get(body, key));
        if (r.error) return err(400, r.error);
        Reflect.set(patch, key, r.value);
      }
      const artIssue = artProblem(body);
      if (artIssue) return err(400, artIssue);
      for (const key of artKeys) {
        if (key in body && body[key] !== undefined) {
          Reflect.set(patch, key, String(body[key] ?? ''));
        }
      }
      if ('id' in patch) Reflect.deleteProperty(patch, 'id');
      if (!Object.keys(patch).length && !classChanged && body.class === undefined) {
        return err(400, 'Send at least one valid field to update.');
      }
      if (typeof patch.name === 'string' && nameTaken(patch.name, id)) {
        return err(400, 'A nation named ' + patch.name + ' already exists.');
      }
      if (patch.catch_names !== undefined || patch.catching_names !== undefined) {
        const primary = patch.catch_names ?? patch.catching_names;
        Reflect.set(patch, 'catch_names', primary);
        Reflect.set(patch, 'catching_names', primary);
      }
      if (patch.catch_names !== undefined || patch.translations !== undefined) {
        const catches = patch.catch_names ?? nation.catch_names ?? new Array();
        if (!catches.length) return err(400, 'At least one catch name is required.');
        const taken = clash(catches.concat(patch.translations ?? nation.translations ?? new Array()), id);
        if (taken) return err(400, taken);
      }
      if ('short_name' in patch && (!patch.short_name || patch.short_name === '')) patch.short_name = null;
      const newWeight = patch.rarity !== undefined ? patch.rarity : patch.weight;
      let weightChanged = false;
      if (newWeight !== undefined) {
        weightChanged = newWeight !== nation.rarity;
        patch.rarity = newWeight;
        patch.weight = newWeight;
      }
      Object.assign(nation, patch);
      const recountNeeded = weightChanged || classChanged;
      return done({}, recountNeeded ? { recount: id } : {});
    }
    if (op === 'nationCategory') {
      const cls = String(body.class ?? '');
      if (!classes.includes(cls)) return err(400, 'Unknown category: ' + cls);
      if (nation.class === cls) return done({});
      Reflect.set(catalog, nation.class, Math.max((Number(Reflect.get(catalog, nation.class)) || 0) - 1, 0));
      Reflect.set(catalog, cls, (Number(Reflect.get(catalog, cls)) || 0) + 1);
      nation.class = cls;
      return done({}, { recount: id });
    }
    if (op === 'nationCard') {
      if (body.regime === undefined && body.economy === undefined) return err(400, 'Send regime (card background) and/or economy (icon).');
      if (body.regime !== undefined) {
        let reg = String(body.regime ?? '').trim();
        if (reg.toLowerCase().endsWith('.png')) reg = reg.slice(0, -4);
        if (!listPng(kw('cardsDir')).includes(reg)) return err(400, 'No such card background: ' + body.regime);
        nation.regime = reg;
      }
      if (body.economy !== undefined) {
        let econ = String(body.economy ?? '').trim();
        const availableIcons = listIcons(kw('iconsDir'));
        if (!availableIcons.includes(econ)) {
          const matched = availableIcons.find((f) => f.slice(0, f.lastIndexOf('.')).toLowerCase() === econ.toLowerCase());
          if (matched) econ = matched;
          else return err(400, 'No such icon: ' + body.economy);
        }
        nation.economy = econ;
      }
      return done({});
    }
    if (op === 'nationArt') {
      if (!nation) return err(400, 'That nation no longer exists.');
      const kind = String(body.kind ?? '');
      if (kind !== 'spawn' && kind !== 'window') return err(400, 'kind must be spawn (the wild artwork) or window (the collection artwork).');
      if (typeof body.data !== 'string' || !body.data) return err(400, 'Send data as a base64 encoded PNG, JPEG or WebP image.');
      const buf = Buffer.from(body.data, 'base64');
      if (buf.length > 10485760) return err(400, 'The file is larger than 10 MB.');
      let ext = '';
      if (buf.length > 12 && buf.readUInt32BE(0) === 0x89504e47) ext = '.png';
      else if (buf.length > 12 && buf.readUInt16BE(0) === 0xffd8) ext = '.jpg';
      else if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') ext = '.webp';
      if (!ext) return err(400, 'The file must be a PNG, JPEG or WebP image.');
      const dir = kind === 'spawn' ? kw('spawnDir') : kw('windowDir');
      const allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const safeBase = Array.from(String(nation.short_name || nation.name)).filter((c) => allowed.includes(c)).join('') || 'Nation' + id;
      let file = String(body.name ?? '').trim();
      if (file) {
        if (!file.split('').every((c) => (allowed + '_-').includes(c)) || file.length > 60) return err(400, 'Names use letters, numbers, - and _ (60 max).');
        file = file + ext;
      } else {
        file = safeBase + (kind === 'window' ? 'Flag' : '') + ext;
        if (fs.existsSync(path.join(dir, file))) file = safeBase + (kind === 'window' ? 'Flag' : '') + id + ext;
      }
      const key = kind === 'spawn' ? 'wild_card' : 'collection_card';
      if (fs.existsSync(path.join(dir, file)) && Reflect.get(nation, key) !== file) return err(400, 'A file named ' + file + ' already exists.');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, file), buf);
      Reflect.set(nation, key, file);
      return done({ file: file });
    }
    if (op === 'categoryAdd') {
      const name = String(body.name ?? '').trim().toLowerCase();
      const first = 'abcdefghijklmnopqrstuvwxyz';
      if (!(name.length >= 2 && name.length <= 20 && first.includes(name.charAt(0)) && name.split('').every((c) => (first + '0123456789_-').includes(c)))) return err(400, 'Category names are 2-20 lowercase letters, numbers, - or _.');
      if (classes.includes(name)) return err(400, 'That category already exists.');
      if (new Array('total', 'total_caught', 'classes', 'collectibles', 'userCollectibles').includes(name)) return err(400, 'That name is reserved.');
      classes.push(name);
      Reflect.set(catalog, name, 0);
      return done({}, { addClass: name });
    }
    if (op === 'categoryDelete') {
      if (!classes.includes(id)) return err(400, 'That category does not exist.');
      if (classes.length <= 1) return err(400, 'The last category cannot be deleted.');
      const used = Object.keys(collectibles).filter((k) => Reflect.get(collectibles, k).class === id).length;
      if (used) return err(400, used + ' nation(s) still use this category. Move them first.');
      catalog.classes = classes.filter((c) => c !== id);
      Reflect.deleteProperty(catalog, id);
      return done({});
    }
    const safe = (name) => name.length > 0 && name.length <= 40 && !name.includes('.') && !name.includes('/') && !name.includes(String.fromCharCode(92));
    if (op === 'backgroundAdd' || op === 'backgroundReplace') {
      const replace = op === 'backgroundReplace';
      const name = replace ? String(id) : String(body.name ?? '').trim();
      if (!safe(name)) return err(400, 'Names use letters, numbers, - and _ (40 max).');
      if (typeof body.data !== 'string' || !body.data) return err(400, 'Send data as a base64 encoded PNG.');
      const buf = Buffer.from(body.data, 'base64');
      if (buf.length > 10485760) return err(400, 'The file is larger than 10 MB.');
      if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('ascii', 12, 16) !== 'IHDR') return err(400, 'The file must be a PNG image.');
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      if (w !== 1428 || h !== 2000) return err(400, 'Card backgrounds must be 1428x2000 pixels (this one is ' + w + 'x' + h + ').');
      const file = path.join(kw('cardsDir'), name + '.png');
      if (replace && !fs.existsSync(file)) return err(404, 'That background does not exist.');
      if (!replace && fs.existsSync(file)) return err(400, 'A background with that name already exists.');
      fs.mkdirSync(kw('cardsDir'), { recursive: true });
      const staged = file + '.upload';
      fs.writeFileSync(staged, buf);
      fs.renameSync(staged, file);
      return JSON.stringify({ status: 200, value: {} });
    }
    if (op === 'backgroundDelete') {
      if (!safe(id) || !listPng(kw('cardsDir')).includes(id)) return err(400, 'That background does not exist.');
      const used = Object.keys(collectibles).filter((k) => Reflect.get(collectibles, k).regime === id).map((k) => '#' + k);
      if (used.length) return err(400, 'Still used by ' + used.slice(0, 8).join(', ') + (used.length > 8 ? '...' : '') + '. Change those nations first.');
      const specials = JSON.parse(kw('specials') || 'null') || {};
      if (Object.values(specials).some((s) => s && String(s.card ?? '').endsWith(id + '.png'))) return err(400, 'A special uses this background.');
      fs.rmSync(path.join(kw('cardsDir'), id + '.png'));
      return JSON.stringify({ status: 200, value: {} });
    }
    return err(400, 'Unknown operation.');
  })()]]
  $let[catalogJson;$js[const c = JSON.parse(ctx.getKeyword('result')).catalog; c ? JSON.stringify(c) : '']]
  $if[$get[catalogJson]!=;$setGlobalVar[collectiblesData;$get[catalogJson]]]
  $!mutex[release;catalog;$get[lock]]
  $let[addCls;$js[JSON.parse(ctx.getKeyword('result')).addClass ?? '']]
  $if[$get[addCls]!=;
    $jsonLoad[users;$searchDB[userCollectibles]]
    $arrayForEach[users;row;
      $let[uid;$env[row;id]]
      $let[rowLock;$mutex[acquire;inv:$get[uid]]]
      $let[inv;$getUserVar[userCollectibles;$get[uid]]]
      $setUserVar[userCollectibles;$js[
        const inv = JSON.parse(ctx.getKeyword('inv') || 'null') || {};
        if (!(ctx.getKeyword('addCls') in inv)) Reflect.set(inv, ctx.getKeyword('addCls'), 0);
        JSON.stringify(inv)
      ];$get[uid]]
      $!mutex[release;inv:$get[uid];$get[rowLock]]
    ]
  ]
  $let[recountId;$js[JSON.parse(ctx.getKeyword('result')).recount ?? '']]
  $if[$get[recountId]!=;$!recountInventories[owners;$get[recountId]]]
  $return[$js[
    const r = JSON.parse(ctx.getKeyword('result'));
    Reflect.deleteProperty(r, 'catalog');
    Reflect.deleteProperty(r, 'recount');
    Reflect.deleteProperty(r, 'addClass');
    JSON.stringify(r)
  ]]
  `,
});
