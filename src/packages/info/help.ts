import { config } from '../../../config';
import type { Command } from '../../types';

const { collectibles, prog } = config.appearance.commands;

const command: Command = {
  data: {
    name: 'help',
    description: 'Show the list of commands from the bot',
    type: 1,
    integration_types: [0, 1],
  },
  code: `
    $addContainer[
      $addTextDisplay[# ${config.name} Discord Bot - help menu]
      $addSeparator[Small]
      $addTextDisplay[**Info**: </about:$botID>]
      $addTextDisplay[**Help**: </help:$botID>]
      $addTextDisplay[**Redeem**: </redeem:$botID>]
      $addTextDisplay[**${collectibles}**: </${collectibles} ${prog.name}:$botID>]
    ]
  `,
};

export default command;
