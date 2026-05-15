export const environment = {
  production: true,
  apiGatewayUrl: 'http://35.154.94.182:8080',
  apiUrl: 'http://35.154.94.182:8080',
  razorpay: {
    checkoutUrl: 'https://checkout.razorpay.com/v1/checkout.js',
    companyName: 'StockPro',
    themeColor: '#0f766e',
    defaultCurrency: 'INR',
    retryMaxCount: 1,
  },
  jwt: {
    tokenKey: 'stockpro_token',
    refreshTokenKey: 'stockpro_refresh_token',
    tokenExpiration: 3600,
  },
};
