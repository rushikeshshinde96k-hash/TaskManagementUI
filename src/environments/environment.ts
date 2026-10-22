// Production: the UI is served by nginx, which proxies /api to the API container.
export const environment = {
  production: true,
  apiUrl: '/api'
};
