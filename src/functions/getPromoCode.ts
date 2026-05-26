import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'getPromoCode',
  // Get info about a promo code from the "codeInfo" variable.
  params: [
    {
      name: 'code',
      // The code whose info to retrieve.
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value to retrieve. i.e. reward, message, uses_left, used_by
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[info;$getVar[codeInfo;$env[code]]]
  $return[$env[info;$env[value]]]
  `,
});
