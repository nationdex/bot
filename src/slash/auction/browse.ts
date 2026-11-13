import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('auction.browse', `
  $interactionReply[
    $ephemeral
    $auctionBrowse[$authorID;all;1]
  ]
  $!auctionSettle
`);
