import { RouteDefinition } from '@nationdex/api';
import { slashes } from '../../../config/slash';

// Encode the static JSON so the ForgeScript parser treats it as one argument.
const payload = encodeURIComponent(JSON.stringify(slashes));

const route: RouteDefinition = {
  url: 'v1/slash/data',
  method: 'GET',
  code: `
  $sendJson[$decodeURIComponent[${payload}]]
`};

export = route;
