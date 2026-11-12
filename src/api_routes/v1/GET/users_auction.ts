import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/users/:id/auction',
  method: 'GET',
  code: `
  $!apiCors
  $let[user;$getParameter[0]]
  $if[$userExists[$get[user]]==false;
    $writeStatus[404;Not Found]
    $sendJson[{"error":"User Not Found"}]
    $stop
  ]
  $let[trusted;$apiTrusted[$getHeader[authorization];inspect.read]]
  $let[settings;$getUserVar[settings;$get[user]]]
  $jsonLoad[prefs;$default[$get[settings];{}]]
  $if[$and[$get[trusted]==false;$env[prefs;profile_privacy]==private];
    $sendJson[{"private":true}]
    $stop
  ]
  $sendJson[$default[$getUserVar[auction;$get[user]];{"total":0,"sold":0,"earnings":0,"onSale":[]}]]
  `,
};

export = route;
