module.exports = {
  workspace: {
    input: 'http://localhost:8000/openapi.json',
    output: {
      target: './api/generated/workspace.ts',
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'axios', // 强制使用 axios 风格的请求参数
      override: {
        mutator: {
          path: './lib/api-client.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
