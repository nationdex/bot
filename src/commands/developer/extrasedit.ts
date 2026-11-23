import { command } from '../../core/define/commands';

export default command('dev.extrasedit', `
  $onlyIf[$authorID==$botOwnerID]
  $sendMessage[$extrasOwnerCommand[edit;$message]]
  $!accessLog[$authorID;extras.command.edit;;]
`);
