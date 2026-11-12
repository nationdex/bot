import { SlashCommand } from '../../core/slashes';

export default SlashCommand('auction.browse', `
  $interactionReply[
    $ephemeral
    $auctionBrowse[$authorID;all;1]
  ]
  $!auctionSettle
`);
