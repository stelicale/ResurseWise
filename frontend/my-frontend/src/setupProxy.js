const { createProxyMiddleware } = require('http-proxy-middleware');

const keycloakTarget = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8081';
const apiTarget = process.env.REACT_APP_API_PROXY_TARGET || 'http://localhost:8088';

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      secure: false,
    })
  );

  app.use(
    '/keycloak',
    createProxyMiddleware({
      target: keycloakTarget,
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/keycloak': '',
      },
    })
  );
};
