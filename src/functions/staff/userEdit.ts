import { ForgeFunction } from '@tryforge/forgescript';
import { variables } from '../../config/variables';

export default new ForgeFunction({
  name: 'userEdit',
  // Applies one validated edit to a user (balance, settings, stats, nations, catches) and returns {status,error,value} as JSON.
  params: [
    {
      name: 'op',
      // balance, setting, settingsReset, stat, auction, give, removeCatch, editCatch or editNation
      type: 'String',
      required: true,
    },
    {
      name: 'user',
      // The user id
      type: 'String',
      required: true,
    },
    {
      name: 'body',
      // The JSON request body
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[user;$env[user]]
  $if[$userExists[$get[user]]==false;$return[{"status":404,"error":"No such Discord user."}]]
  $let[body;$replace[$env[body];null;]]
  $let[locked;$if[$or[$env[op]==balance;$env[op]==setting;$env[op]==settingsReset;$env[op]==stat;$env[op]==auction];$mutex[acquire;user:$get[user]];]]
  $let[balance;$getUserVar[balance;$get[user]]]
  $let[settings;$getUserVar[settings;$get[user]]]
  $let[stats;$getUserVar[userStats;$get[user]]]
  $let[auction;$getUserVar[auction;$get[user]]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[inventory;$getUserVar[userCollectibles;$get[user]]]
  $let[cardsDir;$jsonVar[config;paths.cards]]
  $let[plan;$js[(async () => {
    const err = (error) => JSON.stringify({ status: 400, error: error });
    let body = {};
    try { body = JSON.parse(ctx.getKeyword('body') || 'null') || {}; } catch (e) { return err('The body is not valid JSON.'); }
    if (typeof body !== 'object' || Array.isArray(body)) return err('The body must be a JSON object.');
    const op = String(ctx.getEnvironmentKey('op'));
    const whole = (v, max) => String(v ?? '').trim().length > 0 && String(v).trim().length <= max && String(v).trim().split('').every((c) => c >= '0' && c <= '9');

    if (op === 'balance') {
      const mode = String(body.mode ?? '');
      if (!new Array('set', 'add', 'remove').includes(mode)) return err('mode must be set, add or remove.');
      if (!whole(body.amount, 12)) return err('The amount must be a whole number (up to 12 digits).');
      const n = parseInt(String(body.amount).trim(), 10);
      const cur = Number(JSON.parse(ctx.getKeyword('balance') || '0')) || 0;
      const next = mode === 'set' ? n : mode === 'add' ? cur + n : Math.max(cur - n, 0);
      if (next > 999999999999) return err('That balance is too large.');
      return JSON.stringify({ status: 200, value: { balance: next }, setVar: 'balance', data: String(next) });
    }

    if (op === 'setting') {
      const allowed = { inventory_privacy: new Array('public', 'private'), profile_privacy: new Array('public', 'private'), accept_gifts: new Array('true', 'false') };
      const key = String(body.key ?? '');
      const value = String(body.value ?? '');
      if (!(Reflect.get(allowed, key) || new Array()).includes(value)) return err('Invalid setting.');
      const cur = JSON.parse(ctx.getKeyword('settings') || 'null') || {};
      Reflect.set(cur, key, value);
      return JSON.stringify({ status: 200, value: cur, setVar: 'settings', data: JSON.stringify(cur) });
    }

    if (op === 'settingsReset') return JSON.stringify({ status: 200, value: {}, delVar: 'settings' });

    if (op === 'stat') {
      const key = String(body.key ?? '');
      if (!'${Object.keys(variables.userStats).join(',')}'.split(',').includes(key)) return err('Unknown stat.');
      if (!whole(body.value, 9)) return err('The value must be a whole number.');
      const cur = JSON.parse(ctx.getKeyword('stats') || 'null') || {};
      Reflect.set(cur, key, parseInt(String(body.value).trim(), 10));
      return JSON.stringify({ status: 200, value: cur, setVar: 'userStats', data: JSON.stringify(cur) });
    }

    if (op === 'auction') {
      const cur = JSON.parse(ctx.getKeyword('auction') || 'null') || {};
      cur.total = Number(cur.total) || 0;
      cur.sold = Number(cur.sold) || 0;
      cur.earnings = Number(cur.earnings) || 0;
      cur.onSale = Array.isArray(cur.onSale) ? cur.onSale : new Array();

      const numKeys = new Array('total', 'sold', 'earnings');
      let edited = false;

      if (body.key !== undefined) {
        const k = String(body.key ?? '').trim();
        if (numKeys.includes(k)) {
          if (!whole(body.value, 12)) return err(k + ' must be a non-negative whole number.');
          const n = parseInt(String(body.value).trim(), 10);
          const mode = String(body.mode ?? 'set');
          const prev = Number(Reflect.get(cur, k)) || 0;
          const next = mode === 'add' ? prev + n : mode === 'remove' ? Math.max(prev - n, 0) : n;
          Reflect.set(cur, k, next);
          edited = true;
        } else if (k === 'onSale') {
          if (!Array.isArray(body.value)) return err('onSale must be an array of auction IDs.');
          const list = body.value.map((x) => String(x ?? '').trim()).filter((x) => x);
          Reflect.set(cur, 'onSale', list);
          edited = true;
        } else {
          return err('Invalid auction key: ' + k + '. Valid keys are: total, sold, earnings, onSale.');
        }
      } else {
        for (const k of numKeys) {
          if (k in body && Reflect.get(body, k) !== undefined) {
            if (!whole(Reflect.get(body, k), 12)) return err(k + ' must be a non-negative whole number.');
            Reflect.set(cur, k, parseInt(String(Reflect.get(body, k)).trim(), 10));
            edited = true;
          }
        }
        if ('onSale' in body && Reflect.get(body, 'onSale') !== undefined) {
          if (!Array.isArray(body.onSale)) return err('onSale must be an array of auction IDs.');
          const list = body.onSale.map((x) => String(x ?? '').trim()).filter((x) => x);
          Reflect.set(cur, 'onSale', list);
          edited = true;
        }
      }

      if (!edited) return err('Send at least one of: total, sold, earnings, onSale (or key and value).');
      return JSON.stringify({ status: 200, value: cur, setVar: 'auction', data: JSON.stringify(cur) });
    }

    if (op === 'give') {
      const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
      const nation = Reflect.get(catalog.collectibles || {}, String(body.nation ?? ''));
      if (!nation) return err('That nation does not exist.');
      if (!nation.wild_card || !nation.collection_card) return err('That nation has no artwork yet. Upload it with POST /v1/nations/:id/art first.');
      const count = body.count === undefined ? 1 : Number(body.count);
      if (!Number.isInteger(count) || count < 1 || count > 25) return err('Give between 1 and 25 at a time.');
      const data = JSON.stringify({ id: String(body.nation), author: ctx.getKeyword('user'), attack: String(nation.attack), health: String(nation.health), attack_type: 'buffed', health_type: 'buffed', special: '', card: nation.regime + '.png', timestamp: String(Date.now()), caught_in: '0' });
      return JSON.stringify({ status: 200, value: { given: count }, give: String(body.nation), count: count, data: data });
    }

    if (op === 'removeCatch') {
      const id = String(body.catch ?? '').trim().toUpperCase();
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (!(id.length === 7 && id.split('').every((c) => chars.includes(c)))) return err('Catch IDs are 7 characters (letters and numbers).');
      return JSON.stringify({ status: 200, value: {}, remove: id });
    }

    if (op === 'editCatch' || op === 'editNation') {
      const fs = require('fs');
      const path = require('path');
      const inv = JSON.parse(ctx.getKeyword('inventory') || 'null') || {};
      const heldCatchIds = Array.isArray(inv.collectibleIDs) ? inv.collectibleIDs : new Array();
      if (!heldCatchIds.length) return err('That user does not hold any catches.');

      const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
      catalog.collectibles = catalog.collectibles || {};
      const collectibles = catalog.collectibles;

      let targetCatchIds = new Array();

      if (body.catch !== undefined || body.catch_id !== undefined) {
        const cid = String(body.catch ?? body.catch_id).trim().toUpperCase();
        if (cid.length !== 7 || !cid.split('').every((c) => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(c))) {
          return err('Catch IDs must be 7 characters (letters and numbers).');
        }
        if (!heldCatchIds.includes(cid)) {
          return err('That user does not hold that catch (' + cid + ').');
        }
        targetCatchIds = new Array(cid);
      } else if (Array.isArray(body.catches)) {
        if (!body.catches.length) return err('catches array must not be empty.');
        for (const raw of body.catches) {
          const cid = String(raw).trim().toUpperCase();
          if (cid.length !== 7 || !cid.split('').every((c) => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(c))) {
            return err('Invalid catch ID: ' + raw);
          }
          if (!heldCatchIds.includes(cid)) {
            return err('That user does not hold catch: ' + cid);
          }
          targetCatchIds.push(cid);
        }
      } else if (body.all === true) {
        targetCatchIds = heldCatchIds;
      } else if (body.nation !== undefined || body.collectible_id !== undefined) {
        const natId = String(body.nation ?? body.collectible_id).trim();
        if (!Reflect.has(collectibles, natId)) {
          return err('That nation does not exist in the catalog.');
        }
        targetCatchIds = heldCatchIds;
      } else if (body.id !== undefined) {
        const rawId = String(body.id).trim().toUpperCase();
        if (rawId.length === 7 && heldCatchIds.includes(rawId)) {
          targetCatchIds = new Array(rawId);
        } else if (Reflect.has(collectibles, String(body.id).trim())) {
          targetCatchIds = heldCatchIds;
        } else {
          return err('Send catch (7-character catch ID), catches (array of IDs), or nation (catalog ID).');
        }
      } else {
        return err('Send catch (7-character catch ID), catches (array of IDs), or nation (catalog ID).');
      }

      const db = ctx.client.db;
      const identifiers = targetCatchIds.map((cid) => db.make_intetifier({ type: 'old', name: 'collectible', id: String(cid) }));
      const placeholders = identifiers.map((_, i) => '$' + (i + 1)).join(',');
      const queryRes = await db.pg.query('SELECT identifier, id, value FROM record WHERE identifier IN (' + placeholders + ')', identifiers);
      let rows = queryRes.rows || new Array();

      const isNationFilter = body.catch === undefined && body.catch_id === undefined && !Array.isArray(body.catches) && (body.nation !== undefined || body.collectible_id !== undefined || (body.id !== undefined && !heldCatchIds.includes(String(body.id).trim().toUpperCase())));
      if (isNationFilter) {
        const natId = String(body.nation ?? body.collectible_id ?? body.id).trim();
        rows = rows.filter((r) => {
          try {
            const parsed = JSON.parse(r.value);
            return String(parsed.id) === natId;
          } catch (e) {
            return false;
          }
        });
        if (!rows.length) {
          return err('That user does not hold any catches of nation #' + natId + '.');
        }
      }

      if (!rows.length) {
        return err('No matching catches found for that user.');
      }

      let fieldEdited = false;

      let newAttack = undefined;
      if (body.attack !== undefined) {
        if (!whole(body.attack, 9)) return err('attack must be a non-negative whole number.');
        newAttack = parseInt(String(body.attack).trim(), 10);
        fieldEdited = true;
      }

      let newHealth = undefined;
      if (body.health !== undefined) {
        if (!whole(body.health, 9)) return err('health must be a non-negative whole number.');
        newHealth = parseInt(String(body.health).trim(), 10);
        fieldEdited = true;
      }

      let newAttackType = undefined;
      if (body.attack_type !== undefined) {
        const at = String(body.attack_type).trim().toLowerCase();
        if (at !== 'buffed' && at !== 'nerfed') return err('attack_type must be buffed or nerfed.');
        newAttackType = at;
        fieldEdited = true;
      }

      let newHealthType = undefined;
      if (body.health_type !== undefined) {
        const ht = String(body.health_type).trim().toLowerCase();
        if (ht !== 'buffed' && ht !== 'nerfed') return err('health_type must be buffed or nerfed.');
        newHealthType = ht;
        fieldEdited = true;
      }

      let newCard = undefined;
      if (body.card !== undefined || body.regime !== undefined) {
        let c = String(body.card ?? body.regime).trim();
        if (!c.toLowerCase().endsWith('.png')) c = c + '.png';
        const cardPath = path.join(ctx.getKeyword('cardsDir'), c);
        if (!fs.existsSync(cardPath)) return err('No such card background: ' + c);
        newCard = c;
        fieldEdited = true;
      }

      let newSpecial = undefined;
      if (body.special !== undefined) {
        const s = String(body.special ?? '').trim();
        newSpecial = s === 'null' || s === 'none' ? '' : s;
        fieldEdited = true;
      }

      let newTimestamp = undefined;
      if (body.timestamp !== undefined) {
        if (!whole(body.timestamp, 15)) return err('timestamp must be a valid whole number.');
        newTimestamp = String(body.timestamp).trim();
        fieldEdited = true;
      }

      let newCaughtIn = undefined;
      if (body.caught_in !== undefined) {
        if (!whole(body.caught_in, 12)) return err('caught_in must be a whole number.');
        newCaughtIn = String(body.caught_in).trim();
        fieldEdited = true;
      }

      let targetNewNation = undefined;
      if (!isNationFilter && (body.nation !== undefined || body.new_nation !== undefined || (body.id !== undefined && !heldCatchIds.includes(String(body.id).trim().toUpperCase())))) {
        const nid = String(body.new_nation ?? body.nation ?? body.id).trim();
        if (!Reflect.has(collectibles, nid)) return err('Unknown catalog nation: ' + nid);
        targetNewNation = nid;
        fieldEdited = true;
      }

      if (body.credits !== undefined || body.capacity_name !== undefined || body.capacity_description !== undefined || body.name !== undefined || body.short_name !== undefined) {
        fieldEdited = true;
      }

      if (!fieldEdited) {
        return err('Send at least one field to update: attack, health, attack_type, health_type, special, card (or regime), nation, timestamp, caught_in.');
      }

      const updates = new Array();
      let inventoryChanged = false;
      let catalogChanged = false;

      for (const row of rows) {
        const catchObj = JSON.parse(row.value) || {};
        const oldColId = String(catchObj.id);
        const nat = Reflect.get(collectibles, oldColId) || {};

        if (newAttack !== undefined) {
          catchObj.attack = String(newAttack);
          if (newAttackType === undefined) {
            catchObj.attack_type = newAttack >= (Number(nat.attack) || 0) ? 'buffed' : 'nerfed';
          }
        }
        if (newHealth !== undefined) {
          catchObj.health = String(newHealth);
          if (newHealthType === undefined) {
            catchObj.health_type = newHealth >= (Number(nat.health) || 0) ? 'buffed' : 'nerfed';
          }
        }
        if (newAttackType !== undefined) catchObj.attack_type = newAttackType;
        if (newHealthType !== undefined) catchObj.health_type = newHealthType;
        if (newCard !== undefined) catchObj.card = newCard;
        if (newSpecial !== undefined) catchObj.special = newSpecial;
        if (newTimestamp !== undefined) catchObj.timestamp = newTimestamp;
        if (newCaughtIn !== undefined) catchObj.caught_in = newCaughtIn;

        if (body.credits !== undefined) catchObj.credits = String(body.credits);
        if (body.capacity_name !== undefined) catchObj.capacity_name = String(body.capacity_name);
        if (body.capacity_description !== undefined) catchObj.capacity_description = String(body.capacity_description);

        if (targetNewNation !== undefined && targetNewNation !== oldColId) {
          const oldNat = Reflect.get(collectibles, oldColId) || {};
          const newNat = Reflect.get(collectibles, targetNewNation) || {};
          const oldClass = String(oldNat.class || 'common');
          const newClass = String(newNat.class || 'common');
          const oldWeight = Number(oldNat.weight ?? oldNat.rarity) || 0;
          const newWeight = Number(newNat.weight ?? newNat.rarity) || 0;

          inv[oldClass] = Math.max((Number(inv[oldClass]) || 0) - 1, 0);
          inv[newClass] = (Number(inv[newClass]) || 0) + 1;
          inv.total_value = Math.max((Number(inv.total_value) || 0) - oldWeight + newWeight, 0);

          inv.unique = Array.isArray(inv.unique) ? inv.unique : new Array();
          if (!inv.unique.includes(targetNewNation)) {
            inv.unique.push(targetNewNation);
          }

          if (oldNat && typeof oldNat.global_caught === 'number') {
            oldNat.global_caught = Math.max(oldNat.global_caught - 1, 0);
            catalogChanged = true;
          }
          if (newNat && typeof newNat.global_caught === 'number') {
            newNat.global_caught = (newNat.global_caught || 0) + 1;
            catalogChanged = true;
          }

          catchObj.id = targetNewNation;
          inventoryChanged = true;
        }

        updates.push({ id: row.id, data: JSON.stringify(catchObj) });
      }

      const updatedIds = updates.map((u) => u.id);
      const planResult = {
        status: 200,
        value: {
          updated: updatedIds.length,
          catches: updatedIds
        },
        updates: updates
      };
      if (inventoryChanged) planResult.newInv = JSON.stringify(inv);
      if (catalogChanged) planResult.newCatalog = JSON.stringify(catalog);

      return JSON.stringify(planResult);
    }

    return err('Unknown operation.');
  })()]]
  $jsonLoad[p;$get[plan]]
  $if[$env[p;status]!=200;
    $!mutex[release;user:$get[user];$get[locked]]
    $return[$get[plan]]
  ]
  $if[$jsonHas[p;setVar];$setUserVar[$env[p;setVar];$env[p;data];$get[user]]]
  $if[$jsonHas[p;delVar];$deleteUserVar[$env[p;delVar];$get[user]]]
  $!mutex[release;user:$get[user];$get[locked]]
  $if[$jsonHas[p;give];
    $loop[$env[p;count];$!addUserCollectible[$get[user];$env[p;give];$env[p;data]]]
  ]
  $if[$jsonHas[p;remove];
    $if[$auctionEscrow[$get[user];$env[p;remove]]==false;$return[{"status":400,"error":"That user does not hold that catch."}]]
    $!deleteVar[collectible;$env[p;remove]]
  ]
  $if[$jsonHas[p;updates];
    $let[invLock;$mutex[acquire;inv:$get[user]]]
    $jsonLoad[items;$env[p;updates]]
    $arrayForEach[items;u;
      $setVar[collectible;$env[u;id];$env[u;data]]
    ]
    $if[$jsonHas[p;newInv];
      $setUserVar[userCollectibles;$env[p;newInv];$get[user]]
    ]
    $!mutex[release;inv:$get[user];$get[invLock]]
    $if[$jsonHas[p;newCatalog];
      $let[catLock;$mutex[acquire;catalog]]
      $setGlobalVar[collectiblesData;$env[p;newCatalog]]
      $!mutex[release;catalog;$get[catLock]]
    ]
  ]
  $return[$js[
    const r = JSON.parse(ctx.getKeyword('plan'));
    JSON.stringify({ status: 200, value: r.value })
  ]]
  `,
});
