import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/slash/data',
  method: 'GET',
  code: `
  $!apiCors
  $jsonLoad[data;$djsEval[
    const path = require('path');
    const { slashes } = require(path.resolve(process.cwd(), 'dist/config/slash.js'));
    JSON.stringify(slashes)
  ]]
  $sendJson[$env[data]]
`};

export = route;
