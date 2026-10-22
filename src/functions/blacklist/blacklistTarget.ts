import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'blacklistTarget',
  // Resolves exactly one of a user id or a numeric server id: type is user, guild, none or invalid.
  params: [
    {
      name: 'user',
      // The user option
      type: 'String',
      required: false,
    },
    {
      name: 'guild',
      // The guild id option
      type: 'String',
      required: false,
    },
    {
      name: 'part',
      // type or id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $return[$js[
    const blank = (v) => v === undefined || v === null || v === '' || v === 'null';
    const user = ctx.getEnvironmentKey('user');
    const guild = ctx.getEnvironmentKey('guild');
    const id = String(blank(user) ? guild : user).trim();
    const numeric = id.length > 14 && id.length < 26 && id.split('').every((c) => c >= '0' && c <= '9');
    let type = 'none';
    if (!blank(user) && !blank(guild)) type = 'invalid';
    else if (!blank(user) || !blank(guild)) type = numeric ? (blank(user) ? 'guild' : 'user') : 'invalid';
    ctx.getEnvironmentKey('part') === 'id' ? (type === 'user' || type === 'guild' ? id : '') : type
  ]]
  `,
});
