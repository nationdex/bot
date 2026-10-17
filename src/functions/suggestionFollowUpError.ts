import { ForgeFunction } from '@tryforge/forgescript';
import { errors } from '../config/errors';

export default new ForgeFunction({
  name: 'suggestionFollowUpError',
  // Sends an ephemeral error follow-up after the interaction was already deferred, so the open panel is not replaced.
  params: [
    {
      name: 'message',
      // An errors.ts key or a plain message.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[errors;${JSON.stringify(errors)}]
  $let[message;$if[$jsonHas[errors;$env[message]];$env[errors;$env[message]];$env[message]]]
  $ephemeral
  $interactionFollowUp[
    $addContainer[
      $addTextDisplay[$get[message]]
    ;#FF0000]
  ]
  `,
});
