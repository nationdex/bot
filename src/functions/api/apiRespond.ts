import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'apiRespond',
  // Writes the HTTP status and sends the JSON reply of an API route. The JSON needs a status; ok and statusText are added.
  params: [
    {
      name: 'json',
      // JSON with a status and optional error or value
      type: 'String',
      required: true,
    },
    {
      name: 'actor',
      // The authenticated user id; with an action, a successful reply is written to the access audit
      type: 'String',
      required: false,
    },
    {
      name: 'action',
      // The audit action name, e.g. nations.add
      type: 'String',
      required: false,
    },
    {
      name: 'detail',
      // Short audit detail such as the id the route changed
      type: 'String',
      required: false,
    },
  ],
  code: `
  $jsonLoad[names;{"200":"OK","400":"Bad Request","401":"Unauthorized","403":"Forbidden","404":"Not Found","413":"Payload Too Large","500":"Internal Server Error","503":"Service Unavailable"}]
  $jsonLoad[r;$default[$replace[$env[json];null;];{"status":500,"error":"Empty reply."}]]
  $let[status;$default[$replace[$env[r;status];undefined;];500]]
  $if[$isNumber[$get[status]]==false;$let[status;500]]
  $!jsonSet[r;status;$get[status]]
  $!jsonSet[r;ok;$checkCondition[$get[status]==200]]
  $!jsonSet[r;statusText;$default[$replace[$env[names;$get[status]];undefined;];Error]]
  $let[actor;$replace[$env[actor];null;]]
  $let[action;$replace[$env[action];null;]]
  $if[$and[$get[actor]!=;$get[action]!=;$env[r;status]==200];
    $!accessLog[$get[actor];api:$get[action];;$replace[$env[detail];null;]]
  ]
  $writeStatus[$env[r;status];$env[r;statusText]]
  $sendJson[$env[r]]
  `,
});
