// nextjs-codegen.config.mjs — arquivo de teste (deletar depois)
export default [
  {
    name: 'fastfigma-test',
    spec: 'https://api.fastfigma.com/api-json',
    routesOut: 'tmp-test/src/app/api',
    servicesOut: 'tmp-test/src/services',
    apiEnvVar: 'API_URL',
    apiFallback: 'https://api.fastfigma.com',
    stripPathPrefix: '/api',
    cookieName: 'accessToken',
    apiClient: {
      outputPath: 'tmp-test/src/lib/apiClient.ts',
      deviceTracking: true,
      unauthorizedRedirect: '/login',
    },
    fetchBackend: {
      outputPath: 'tmp-test/src/lib/fetchBackend.ts',
    },
  },
];
