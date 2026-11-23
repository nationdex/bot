import type { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/collectibles/data',
  method: 'GET',
  code: `
  $let[id;$getQuery[id]]
  $jsonLoad[collectibles;$collectiblesData[collectibles]]
  $jsonLoad[ids;$jsonKeys[collectibles]]

  $ifx[
    $if[$get[id]!=;
      $if[$arrayIndexOf[ids;$get[id]]!=-1;
        $sendJson[$env[collectibles;$get[id]]]
      ;
        $writeStatus[404;Not Found]
        $sendJson[{"error": "Collectible Not Found"}]
      ]
    ]
    $else[
      $sendJson[$getGlobalVar[collectiblesData]]
    ]
  ]
  `
};

export = route;
