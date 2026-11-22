import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'jsonVar',
  // Retrieves info from a json global variable.
  params: [
    {
      name: 'variable',
      // The variable to retrieve the info from.
      type: 'String',
      required: false,
    },
    {
      name: 'key',
      // The key/path to retrieve (e.g. 'color', 'author.name', 'collectible.singular').
      type: 'String',
      required: false,
    },
    {
      name: 'default',
      // The fallback value if key does not exist.
      type: 'String',
      required: false,
    },
  ],
  code: `$return[$getGlobalVar[$env[variable];$env[default];$env[key]]]`,
});
