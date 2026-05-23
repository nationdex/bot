import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  name: 'eval',
  aliases: ['ev'],
  type: 'messageCreate',
  code: `
    $onlyForUsers[;$botOwnerID;910837428862984213;903681538842054686]
    $eval[$message]
  `,
});
