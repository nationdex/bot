import { ForgeFunction } from '@tryforge/forgescript';
import { errors } from '../../config/errors';

export default new ForgeFunction({
  name: 'err',
  // Returns a custom error message.
  params: [
    {
      name: 'message',
      // The error message.
      type: 'String',
      required: true,
    },
    {
      name: 'ephemeral',
      // Whether to make it ephemeral.
      type: 'String',
      required: false,
    },
    {
      name: 'delete?',
      // Whether to delete the error message, only works for non-ephemeral, true if left empty.
      type: 'String',
      required: false,
    },
  ],
  code: `
  $jsonLoad[errors;${JSON.stringify(errors)}]
  $let[message;$if[$jsonHas[errors;$env[message]];$env[errors;$env[message]];$env[message]]]
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
