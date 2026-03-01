const { createProxyMiddleware } = require('http-proxy-middleware');

const keycloakTarget = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8081';

module.exports = function setupProxy(app) {
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
