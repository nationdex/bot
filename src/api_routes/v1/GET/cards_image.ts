import { RouteDefinition } from '@nationdex/api';

const route: RouteDefinition = {
  url: 'v1/cards/:id/image',
  method: 'GET',
  code: `
  $!apiCors
  $let[id;$getParameter[0]]
  $jsonLoad[cards;$cardList]
  $arrayMap[cards;card;$return[$env[card;id]];ids]
  $if[$and[$get[id]!=;$arrayIncludes[ids;$get[id]]];
    $!writeHeader[Cache-Control;public, max-age=3600]
    $sendFile[$jsonVar[config;paths.cards]/$get[id].png]
  ;
    $writeStatus[404;Not Found]
    $sendJson[{"error": "Card Not Found"}]
  ]
  `
};

export = route;
