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
  $let[reply;$js[
    const text = new Object();
    Reflect.set(text, 200, 'OK');
    Reflect.set(text, 400, 'Bad Request');
    Reflect.set(text, 401, 'Unauthorized');
    Reflect.set(text, 403, 'Forbidden');
    Reflect.set(text, 404, 'Not Found');
    Reflect.set(text, 413, 'Payload Too Large');
    Reflect.set(text, 500, 'Internal Server Error');
    Reflect.set(text, 503, 'Service Unavailable');
    const body = JSON.parse(ctx.getEnvironmentKey('json') || 'null') || { status: 500, error: 'Empty reply.' };
    body.status = Number(body.status) || 500;
    body.ok = body.status === 200;
    body.statusText = Reflect.get(text, body.status) || 'Error';
    JSON.stringify(body)
  ]]
  $jsonLoad[r;$get[reply]]
  $let[actor;$replace[$env[actor];null;]]
  $let[action;$replace[$env[action];null;]]
  $if[$and[$get[actor]!=;$get[action]!=;$env[r;status]==200];
    $!accessLog[$get[actor];api:$get[action];;$replace[$env[detail];null;]]
  ]
  $!apiCors
  $writeStatus[$env[r;status];$env[r;statusText]]
  $sendJson[$env[r]]
  `,
});
