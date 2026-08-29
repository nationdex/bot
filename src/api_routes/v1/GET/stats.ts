import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/stats',
  method: 'GET',
  code: `
  $jsonLoad[registeredUsers;$default[$searchDB[userCollectibles];[\\]]]
  $jsonLoad[registeredGuilds;$default[$searchDB[spawnconfig];[\\]]]

  $jsonLoad[result;{}]
  $!jsonSet[result;collectibles_caught_global;$collectiblesData[total_caught]]
  $!jsonSet[result;collectibles_count;$collectiblesData[total]]
  $!jsonSet[result;registered_users;$arrayLength[registeredUsers]]
  $!jsonSet[result;registered_guilds;$arrayLength[registeredGuilds]]

  $sendJson[$env[result]]
  `
};

export = route;
