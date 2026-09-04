import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/slash/data',
  method: 'GET',
  code: `
  $jsonLoad[data;$djsEval[
    const path = require('path');
    const { slashCommands } = require(path.resolve(process.cwd(), 'dist/config/slash.js'));
    JSON.stringify(slashCommands)
  ]]
  $sendJson[$env[data]]
`};

export = route;
