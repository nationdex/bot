import { command } from '../../core/define/commands';

export default command('dev.extraslist', `
  $onlyIf[$authorID==$botOwnerID]
  $sendMessage[$extrasOwnerCommand[list;$message]]
  $!accessLog[$authorID;extras.command.list;;]
`);
