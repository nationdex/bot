import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'err',
  // Returns a custom error message
  params: [
    {
      name: 'message',
      // The error message
      type: 'String',
      required: true,
    },
    {
      name: 'ephemeral',
      // Whether to make it ephemeral
      type: 'String',
      required: false,
    },
    {
      name: 'delete?',
      // Whether to delete the error message, only works for non-ephemeral. true if left empty
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[message;$env[message]]
  $let[delete;$if[$isBoolean[$env[delete?]];$env[delete?];true]]
  
  $ifx[
    $if[$env[ephemeral];
      $return[
        $interactionReply[
          $ephemeral
          $addContainer[
            $addTextDisplay[$get[message]]
          ;#FF0000]
        ]
      ]
    ]
    
    $else[
      $if[$get[delete];
        $return[
          $let[msg;$sendMessage[$channelID;
            $disableAllMentions
            $reply
            $addContainer[
              $addTextDisplay[$get[message]]
            ;#FF0000]
          ;true]]
          
          $setTimeout[
            $if[$and[$channelExists[$channelID];$messageExists[$channelID;$get[msg]]];
              $!deleteMessage[$channelID;$get[msg]]
            ]
          ;5s]
        ]
      ;
        $return[
          $sendMessage[$channelID;
            $disableAllMentions
            $reply
            $addContainer[
              $addTextDisplay[$get[message]]
            ;#FF0000]
          ]
        ]
      ]
    ]
  ]
  `,
});
