export const environment = {
  production: true,
  apiGatewayUrl: '',
  apiUrl: '',
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

