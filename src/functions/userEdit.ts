import { ForgeFunction } from '@tryforge/forgescript';
import { variables } from '../config/variables';
export default new ForgeFunction({
  name: 'userEdit',
  // Applies one validated edit to a user (balance, settings, stats, nations) and returns {status,error,value} as JSON.
  params: [
    {
      name: 'op',
      // balance, setting, settingsReset, stat, give or removeCatch
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
  $let[balance;$getUserVar[balance;$get[user]]]
  $let[settings;$getUserVar[settings;$get[user]]]
  $let[stats;$getUserVar[userStats;$get[user]]]
  $let[catalog;$getGlobalVar[collectiblesData]]
  $let[plan;$js[(() => {
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
    if (op === 'give') {
      const catalog = JSON.parse(ctx.getKeyword('catalog') || 'null') || {};
      const nation = Reflect.get(catalog.collectibles || {}, String(body.nation ?? ''));
      if (!nation) return err('That nation does not exist.');
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
    return err('Unknown operation.');
  })()]]
  $jsonLoad[p;$get[plan]]
  $if[$env[p;status]!=200;$return[$get[plan]]]
  $if[$jsonHas[p;setVar];$setUserVar[$env[p;setVar];$env[p;data];$get[user]]]
  $if[$jsonHas[p;delVar];$deleteUserVar[$env[p;delVar];$get[user]]]
  $if[$jsonHas[p;give];
    $loop[$env[p;count];$!addUserCollectible[$get[user];$env[p;give];$env[p;data]]]
  ]
  $if[$jsonHas[p;remove];
    $if[$auctionEscrow[$get[user];$env[p;remove]]==false;$return[{"status":400,"error":"That user does not hold that catch."}]]
    $!deleteVar[collectible;$env[p;remove]]
  ]
  $return[$js[
    const r = JSON.parse(ctx.getKeyword('plan'));
    JSON.stringify({ status: 200, value: r.value })
  ]]
  `,
});
