import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'sortData',
  // Sort the given data and return the sorted data.
  params: [
    {
      name: 'data',
      // The JSON data to sort.
      type: 'String',
      required: true,
    },
    {
      name: 'key',
      // The key to sort the data by.
      type: 'String',
      required: false,
    },
    {
      name: 'order',
      // The sorting order, asc or desc.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $if[$isJSON[$env[data]];
      $return[$js[const json = $env[data];
    if (json == null || typeof json !== "object") { JSON.stringify(json != null ? json : null) }
    else if ((Array.isArray(json) && json.length === 0) || Object.keys(json).length === 0) { JSON.stringify(json) }
    else {
    const sortKey = "$env[key]";
    const order = "$default[$env[order];desc]";
    const isArray = Array.isArray(json);
    const entries = isArray ? json.map((v, i) => [String(i), v\\]) : Object.entries(json);
    const isFlat = entries.every(([, v\\]) => typeof v !== "object" || v === null);
    const sorted = entries.sort(([aKey, a\\], [bKey, b\\]) => {
    const aVal = isFlat ? a : a[sortKey\\];
    const bVal = isFlat ? b : b[sortKey\\];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return order === "desc" ? -cmp : cmp;
  });
  JSON.stringify(isArray ? sorted.map(([, v\\]) => v) : Object.fromEntries(sorted), null, 2) }]]
  ;$return[$env[data]]]
  `,
});
