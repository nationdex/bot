import { config } from '../../../config';
import type { Command } from '../../types';

const { collectibles, comp, list } = config.appearance.commands;

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
      $addSeparator[]
      $addSection[
        $addTextDisplay[**Config**: </config channel:$botID></config disable:$botID>]
        $addTextDisplay[**Info**: </about:$botID>]
        $addTextDisplay[**Help**: </help:$botID>]
        $addTextDisplay[**Player**: </profile:$botID>]
        $addTextDisplay[**${collectibles}**: </${collectibles} ${comp.name}:$botID></${collectibles} ${list.name}>]
      ]
    ]
  `,
};

export default command;
