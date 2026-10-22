import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'refreshSuggestion',
  // Re-renders a suggestion's public channel message, if it has one. Failures are ignored.
  params: [
    {
      name: 'id',
      // The suggestion id to refresh.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[id;$env[id]]
  $jsonLoad[s;$getSuggestion[$get[id]]]
  $let[channel;$env[s;channelId]]
  $let[msg;$env[s;messageId]]
  $if[$and[$get[channel]!=;$get[msg]!=];
    $try[
      $!editMessage[$get[channel];$get[msg];
        $disableAllMentions
        $suggestionEmbed[$get[id]]
      ]
    ;
      $log[suggestions: Could not refresh the message of suggestion #$get[id]]
    ]
  ]
  `,
});
