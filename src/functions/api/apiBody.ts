import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'apiBody',
  // Reads the request body of an API route. Answers 413 and stops the route when it is longer than the limit.
  params: [
    {
      name: 'limit',
      // Maximum body length in characters.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[body;$getBody]
  $if[$charCount[$get[body]]>$env[limit];
    $apiRespond[{"status":413,"error":"The request body is too large."}]
    $stop
  ]
  $return[$get[body]]
  `,
});
