import { SlashCommand } from '../../util/slashes';

export default SlashCommand('auction.browse', `
  $interactionReply[
    $ephemeral
    $auctionBrowse[$authorID;all;1]
  ]
  $!auctionSettle
`);
