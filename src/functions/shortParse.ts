import { ForgeFunction } from "@tryforge/forgescript";

export default new ForgeFunction({
  name: 'shortParse',
  // Parse the given milliseconds into a short string (e.g., 1000ms -> 1s, 59890ms -> 59.89s)
  params: [
    {
      name: 'ms',
      // The milliseconds to parse
      type: 'String',
      required: true,
    },
    {
      name: 'decimals',
      // The decimals length, put -1 for no limit
      type: 'String',
      required: false,
    },
  ],
  code: `
  $onlyIf[$isInteger[$env[ms]]]
  $return[$js[
    const ms = Number($env[ms]);
    const dec = "$default[$env[decimals];0]";
    const decimals = Number(dec);
    const units = [
      { label: "d", value: 86400000 },
      { label: "h", value: 3600000 },
      { label: "m", value: 60000 },
      { label: "s", value: 1000 },
    \\];
    let result = ms + "ms";
    for (const u of units) {
      if (Math.abs(ms) >= u.value) {
        const val = ms / u.value;
        result = (decimals === -1 ? String(val) : val.toFixed(decimals).replace(/\\.?0+$/, "")) + u.label;
        break;
      }
    }
    result;
  ]]
  `
});