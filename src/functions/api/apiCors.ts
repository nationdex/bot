import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'apiCors',
  // Adds the CORS headers when the request comes from an origin listed in config api.allowedOrigins. preflight also sends the allowed methods and headers.
  params: [
    {
      name: 'mode',
      // preflight for an OPTIONS request, empty otherwise
      type: 'String',
      required: false,
    },
  ],
  brackets: false,
  code: `
  $let[origin;$getHeader[origin]]
  $if[$get[origin]==;$return[]]
  $let[allowed;$replace[$replace[$jsonVar[config;api.allowedOrigins];undefined;];null;]]
  $arrayLoad[origins;,;$replace[$get[allowed]; ;]]
  $if[$arrayIncludes[origins;$get[origin]]==false;$return[]]
  $!writeHeader[Access-Control-Allow-Origin;$get[origin]]
  $!writeHeader[Vary;Origin]
  $if[$replace[$env[mode];null;]==preflight;
    $!writeHeader[Access-Control-Allow-Methods;GET, POST, OPTIONS]
    $!writeHeader[Access-Control-Allow-Headers;Authorization, Content-Type]
    $!writeHeader[Access-Control-Max-Age;600]
  ]
  `,
});
