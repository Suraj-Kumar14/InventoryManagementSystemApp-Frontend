export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  jwt: {
    tokenKey: 'stockpro_token',
    refreshTokenKey: 'stockpro_refresh_token',
    tokenExpiration: 3600, // 1 hour in seconds
  },
};

