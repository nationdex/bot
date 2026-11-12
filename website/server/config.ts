export const serverConfig = {
  apiBaseUrl: process.env.API_BASE_URL || '',
  apiToken: process.env.API_BEARER_TOKEN || '',
  routes: {
    collectibles: '/collectibles/data',
    config: '/config',
    configAdd: '/config/add',
    configDelete: '/config/delete',
    configReset: '/config/reset',
    searchDb: '/search_db',
    stats: '/stats',
    user: '/user',
    users: '/users',
    nations: '/nations',
    cardsBackgrounds: '/cards/backgrounds',
    cards: '/cards',
  },
  timeoutMs: 5000,
};