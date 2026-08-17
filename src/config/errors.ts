import { ctbl } from './collectible';
import { currency } from './currency';

export const errors = {
  generic: `Something went wrong.`,
  no_perms: `You need **Manage Server** permissions to use this command.`,
  not_author: `You cannot use this!`,
  invalid_collectible: `Invalid ${ctbl.singular}!`,
  no_collectibles_found: `No ${ctbl.plural} found`,
  bots_cant_collect: `Bots cannot collect ${ctbl.plural}.`,
  bots_cant_gift: `Bots cannot accept gifts`,
  gift_self: `You cannot send gifts to yourself`,
  decline_gifts: `**{user_name}** does not accept gifts`,
  inv_private: `**{user_name}** has their inventory private`,
  give_self: `You cannot give ${currency.plural} to yourself`,
  bots_cant_earn: `Bots cannot acquire ${currency.plural}`,
  decline_currency: `**{user_name}** does not accept ${currency.plural}`,
  bots_no_bal: `Bots do not have ${currency.plural}!`,
  min_amount: `Please specify a minimum amount of **1**`,
  low_bal: `You do not have enough ${currency.plural}!`,
  reply_to_message: `Please reply to the message you want to compare.`,
  no_spawn: `No ${ctbl.plural} have spawned in this server yet.`,
  collectible_not_caught: `No one caught the last ${ctbl.singular}.`,
  compare_self: `You cannot compare a user to themselves.`,
  message_sent_early: `That message was sent before the ${ctbl.singular} was summoned.`,
  wrong_collectible: `Incorrect name, not even close.`,
};