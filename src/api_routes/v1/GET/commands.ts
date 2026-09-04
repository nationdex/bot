import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/commands/data',
  method: 'GET',
  code: `
  $jsonLoad[data;$djsEval[
    const path = require('path');
    const { commands } = require(path.resolve(process.cwd(), 'dist/config/commands.js'));
    JSON.stringify(commands)
  ]]
  $sendJson[$env[data]]
`};

export = route;