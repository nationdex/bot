import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'publishSuggestion',
  // Posts a suggestion to the configured suggestions channel and stores its message location. Failures are ignored.
  params: [
    {
      name: 'id',
      // The suggestion id to post.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $let[channel;$getGlobalVar[suggestionsChannel;none]]
  $if[$and[$get[channel]!=none;$get[channel]!=;$channelExists[$get[channel]]];
    $try[
      $let[msg;$sendMessage[$get[channel];
        $disableAllMentions
        $suggestionEmbed[$get[id]]
      ;true]]
      $if[$get[msg]!=;
        $!updateSuggestion[$get[id];;;;;$get[msg];$get[channel]]
      ]
    ;
      $log[suggestions: Could not post suggestion #$get[id] to $get[channel]]
    ]
  ]
  `,
});
