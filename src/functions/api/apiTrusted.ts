import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'apiTrusted',
  // Returns true when the request carries a valid Bearer token whose owner holds the capability. Never answers or stops the route.
  params: [
    {
      name: 'header',
      // The Authorization header of the request.
      type: 'String',
      required: false,
    },
    {
      name: 'capability',
      // The capability to look for.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[header;$replace[$env[header];null;]]
  $let[token;$js[
    const h = ctx.getKeyword('header').trim();
    const t = h.slice(7);
    h.startsWith('Bearer ndx_') && t.length === 68 && t.slice(4).split('').every((c) => '0123456789abcdef'.includes(c)) ? t : ''
  ]]
  $if[$get[token]==;$return[false]]
  $jsonLoad[acc;$getGlobalVar[access]]
  $let[user;$env[acc;tokens;$sha256[$get[token]];user]]
  $if[$or[$get[user]==;$get[user]==undefined];$return[false]]
  $return[$hasCap[$get[user];$env[capability];home]]
  `,
});
