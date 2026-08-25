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
  code: `$jsonLoad[data;$default[$getGlobalVar[$env[variable]];{}]]

  $return[$js[
    (() => {
      const data = ctx.getEnvironmentKey("data");
      const key = String(ctx.getEnvironmentKey("key") ?? "").trim();
      const def = ctx.getEnvironmentKey("default") ?? "";

      if (!key) {
        return typeof data === "object" ? JSON.stringify(data) : (data ?? def);
      }

      const parts = key.split(".");
      let val = data;
      for (const p of parts) {
        if (val === null || val === undefined || typeof val !== "object") {
          val = undefined;
          break;
        }
        val = Reflect.get(val, p);
      }

      if (val === undefined || val === null) {
        return def;
      } else if (typeof val === "object") {
        return JSON.stringify(val);
      }
      return String(val);
    })()
  ]]
  `,
});
