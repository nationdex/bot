import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/guilds/:id',
  method: 'GET',
  code: `
  $let[guild;$getParameter[0]]
  $if[$and[$get[guild]!=;$replaceRegex[$get[guild];\\\\d{15,25};;]==]==false;
    $writeStatus[400;Bad Request]
    $sendJson[{"error":"Invalid Discord guild ID."}]
    $stop
  ]
  $if[$guildExists[$get[guild]]==false;
    $writeStatus[404;Not Found]
    $sendJson[{"error":"Guild Not Found"}]
    $stop
  ]
  $jsonLoad[cfg;$default[$getGuildVar[spawnConfig;$get[guild]];{}]]
  $sendJson[{
    "guild": "$get[guild]",
    "status": "$default[$env[cfg;status];enabled]",
    "config_channel": "$default[$env[cfg;config_channel];]",
    "weight": $default[$env[cfg;weight];0],
    "timestamp": "$default[$env[cfg;timestamp];]"
  }]
  `,
};

export = route;
