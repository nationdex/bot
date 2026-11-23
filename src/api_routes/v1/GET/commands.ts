import type { RouteDefinition } from '@nationdex/api';
import { commands } from '../../../config/commands';

// Encode the static JSON so the ForgeScript parser treats it as one argument.
const payload = encodeURIComponent(JSON.stringify(commands));

const route: RouteDefinition = {
  url: 'v1/commands/data',
  method: 'GET',
  code: `
  $sendJson[$decodeURIComponent[${payload}]]
`};

export default route;
