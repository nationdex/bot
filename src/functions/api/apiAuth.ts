import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'apiAuth',
  // Authenticates an API request from its Bearer token and checks a capability. Answers 401 or 403 and stops the route when it fails; otherwise returns the user id.
  params: [
    {
      name: 'header',
      // The Authorization header of the request
      type: 'String',
      required: false,
    },
    {
      name: 'capability',
      // The capability the route needs
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[header;$trim[$replace[$env[header];null;]]]
  $let[token;$if[$sliceText[$get[header];0;1]==Bearer;$sliceText[$get[header];1;2];]]
  $if[$get[token]==;
    $apiRespond[{"status":401,"error":"Missing or invalid API token."}]
    $stop
  ]
  $jsonLoad[acc;$getGlobalVar[access]]
  $let[user;$env[acc;tokens;$sha256[$get[token]];user]]
  $if[$or[$get[user]==;$get[user]==undefined];
    $apiRespond[{"status":401,"error":"Missing or invalid API token."}]
    $stop
  ]
  $if[$and[$env[capability]==extras.manage;$get[user]!=$botOwnerID];
    $apiRespond[{"status":403,"error":"Only the bot owner can manage extras."}]
    $stop
  ]
  $if[$hasCap[$get[user];$env[capability];home]==false;
    $apiRespond[{"status":403,"error":"Your account lacks the $env[capability] capability."}]
    $stop
  ]
  $return[$get[user]]
  `,
});
