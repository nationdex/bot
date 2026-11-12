import type { Connect, Plugin } from 'vite';

export function adminApiPlugin(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    void import('./handlers').then(({ handleAdminApi }) => {
      void handleAdminApi(req, res).then((handled) => {
        if (!handled) next();
      });
    });
  };

  return {
    name: 'admin-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}