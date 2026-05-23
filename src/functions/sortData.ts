import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'sortData',
  // Sort the given data and returns the new sorted data
  params: [
    {
      name: 'data',
      // The json data to sort
      type: 'String',
      required: true,
    },
    {
      name: 'key',
      // The key on whose basis to sort the data
      type: 'String',
      required: false,
    },
    {
      name: 'order',
      // The sorting order, asc or desc
      type: 'String',
      required: false,
    },
  ],
  code: `$return[$js[const json = $env[data];
const sortKey = "$env[key]";
const order = "$default[$env[order];desc]";

const isFlat = Object.values(json).every(v => typeof v !== "object" || v === null);

JSON.stringify(Object.fromEntries(
  Object.entries(json).sort(([aKey, a\\], [bKey, b\\]) => {
    const aVal = isFlat ? a : a[sortKey\\];
    const bVal = isFlat ? b : b[sortKey\\];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return order === "desc" ? -cmp : cmp;
  })
), null, 2);]]
  `,
});
