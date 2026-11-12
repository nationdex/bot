import { SlashCommand } from '../../core/slashes';

export default SlashCommand('access.evalchannel', `
  $let[s;$accessEvalChannel[$option[channel]]]
  $onlyIf[$get[s]==ok;$err[access_$get[s];true]]
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[## Eval channel updated
Eval is now limited to $if[$replace[$option[channel];null;]==;the whole home server;<#$option[channel]>].]
    ;$jsonVar[config;accent]]
  ]
`);
