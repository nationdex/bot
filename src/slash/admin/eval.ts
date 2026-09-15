import { slashCommand } from '../../util/slashes';

export default slashCommand('admin.eval', `
  $djsEval[
    (async () => {
      const handler = globalThis.__ndxEvalSession || require('../../util/evalSession');
      await handler.startEvalSlash(ctx);
    })()
  ]
  $stop
`);
