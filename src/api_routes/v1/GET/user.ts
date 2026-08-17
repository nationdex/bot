import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/user',
  method: 'GET',
  code: `
  $let[user;$getQuery[id]]

  $ifx[
    $if[$and[$get[user]!=;$userExists[$get[user]]];
      $sendJson[{
        "collectiblesData": $getUserVar[userCollectibles;$get[user]],
        "auctionData": $getUserVar[auction;$get[user]],
        "settings": $getUserVar[settings;$get[user]]
      }]
    ]
    $else[
      $writeStatus[404;Not Found]
      $sendJson[{"error": "User Not Found"}]
    ]
  ]
  `
};

export = route;
