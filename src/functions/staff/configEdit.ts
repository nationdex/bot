import { ForgeFunction } from '@tryforge/forgescript';
import { baseSettings } from '../../config/variables';
export default new ForgeFunction({
  name: 'configEdit',
  // Applies one validated edit to the bot config or keywords and returns {status,error,value} as JSON.
  params: [
    {
      name: 'op',
      // set, add, delete or reset
      type: 'String',
      required: true,
    },
    {
      name: 'body',
      // The JSON request body: root plus path, parent, key and value
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[body;$replace[$env[body];null;]]
  $let[root;$js[(() => { try { return String((JSON.parse(ctx.getKeyword('body') || 'null') || {}).root ?? ''); } catch (e) { return ''; } })()]]
  $if[$and[$get[root]!=config;$get[root]!=keywords];$return[{"status":400,"error":"root must be config or keywords."}]]
  $let[lock;$mutex[acquire;config:$get[root]]]
  $let[current;$if[$get[root]==config;$getGlobalVar[config];$getGlobalVar[keywords]]]
  $let[result;$js[(() => {
    const base = ${JSON.stringify(baseSettings)};
    const err = (error) => JSON.stringify({ status: 400, error: error });
    let body = null;
    try { body = JSON.parse(ctx.getKeyword('body') || 'null'); } catch (e) { return JSON.stringify({ status: 400, error: 'The body is not valid JSON.' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return err('The body must be a JSON object.');
    const root = ctx.getKeyword('root');
    const op = String(ctx.getEnvironmentKey('op'));
    const tree = JSON.parse(ctx.getKeyword('current') || 'null') || {};
    const builtin = Reflect.get(base, root);
    const dig = (obj, path) => path.split('.').reduce((node, k) => (node && typeof node === 'object' ? Reflect.get(node, k) : undefined), obj);
    const parentOf = (path) => {
      const keys = path.split('.');
      return { node: keys.length > 1 ? dig(tree, keys.slice(0, -1).join('.')) : tree, leaf: keys.at(-1) };
    };
    const value = String(body.value ?? '').trim();
    const path = String(body.path ?? '');
    const digits = '0123456789abcdefABCDEF';
    const bad = (p, v) => {
      if (v.length > 300) return 'The value is too long (300 characters max).';
      if (root === 'config') {
        if (p === 'accent' && !(v.length === 7 && v.charAt(0) === '#' && v.slice(1).split('').every((c) => digits.includes(c)))) return 'The accent must be a hex colour like #4000ff.';
        if (p === 'prefix' && !(v.length >= 1 && v.length <= 5 && !v.includes(' '))) return 'The prefix must be 1-5 characters without spaces.';
        if (p === 'logChannel' && v && !(v.length > 14 && v.length < 26 && v.split('').every((c) => c >= '0' && c <= '9'))) return 'The log channel must be a channel ID or empty.';
        if (p.startsWith('paths.') && (!v || v.startsWith('/') || v.includes(String.fromCharCode(92)) || v.split('/').includes('..') || v.includes(':'))) return 'Paths must be relative and cannot contain "..".';
        if ((p.startsWith('urls.') || p.startsWith('maintainers.') || p.endsWith('.repo')) && !(v.startsWith('http://') || v.startsWith('https://'))) return 'That must be a full http(s) URL.';
        if (p === 'bot.name' && (!v || v.length > 32)) return 'The bot name must be 1-32 characters.';
        if (p === 'api.allowedOrigins' && v && !v.split(',').map((o) => o.trim()).every((o) => (o.startsWith('http://') || o.startsWith('https://')) && !o.slice(o.indexOf('//') + 2).includes('/') && !o.includes(' '))) return 'Allowed origins are comma separated origins such as https://nationdex.com, without a path.';
      } else if (!(v.length >= 1 && v.length <= 32 && v.split('').every((c) => 'abcdefghijklmnopqrstuvwxyz0123456789_-'.includes(c)))) {
        return 'Keywords become command names: use 1-32 lowercase letters, numbers, - or _.';
      }
      return '';
    };
    if (op === 'set') {
      let located = parentOf(path);
      const original = dig(builtin, path);
      if ((!located.node || typeof located.node !== 'object' || !(located.leaf in located.node)) && original !== undefined && typeof original !== 'object') {
        const keys = path.split('.');
        let cursor = tree;
        keys.slice(0, -1).forEach((k) => {
          if (!Reflect.get(cursor, k) || typeof Reflect.get(cursor, k) !== 'object') Reflect.set(cursor, k, {});
          cursor = Reflect.get(cursor, k);
        });
        Reflect.set(cursor, keys.at(-1), original);
        located = parentOf(path);
      }
      const { node, leaf } = located;
      if (!node || typeof node !== 'object' || !(leaf in node) || typeof Reflect.get(node, leaf) === 'object') return err('That setting does not exist.');
      const problem = bad(path, value);
      if (problem) return err(problem);
      Reflect.set(node, leaf, value);
    } else if (op === 'add') {
      const parent = String(body.parent ?? '').trim();
      const key = String(body.key ?? '');
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (!(key.length >= 1 && key.length <= 32 && letters.includes(key.charAt(0)) && key.split('').every((c) => (letters + '0123456789_').includes(c)))) return err('Keys use letters, numbers and underscores (32 max).');
      const problem = bad(parent ? parent + '.' + key : key, value);
      if (problem) return err(problem);
      const node = parent ? dig(tree, parent) : tree;
      if (!node || typeof node !== 'object' || Array.isArray(node)) return err('That group does not exist.');
      if (key in node) return err('That key already exists.');
      Reflect.set(node, key, value);
    } else if (op === 'delete') {
      if (dig(builtin, path) !== undefined) return err('Built-in settings cannot be deleted, only edited.');
      const { node, leaf } = parentOf(path);
      if (!node || !(leaf in node)) return err('That setting does not exist.');
      Reflect.deleteProperty(node, leaf);
    } else if (op === 'reset') {
      const original = dig(builtin, path);
      if (original === undefined || typeof original === 'object') return err('Only built-in settings can be reset.');
      const { node, leaf } = parentOf(path);
      if (!node) return err('That setting does not exist.');
      Reflect.set(node, leaf, original);
    } else {
      return err('Unknown operation.');
    }
    return JSON.stringify({ status: 200, value: {}, tree: tree });
  })()]]
  $jsonLoad[r;$get[result]]
  $if[$env[r;status]==200;
    $if[$get[root]==config;
      $setGlobalVar[config;$jsonStringify[$env[r;tree]]]
    ;
      $setGlobalVar[keywords;$jsonStringify[$env[r;tree]]]
    ]
  ]
  $!mutex[release;config:$get[root];$get[lock]]
  $!jsonDelete[r;tree]
  $return[$jsonStringify[$env[r]]]
  `,
});
