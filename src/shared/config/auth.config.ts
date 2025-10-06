const authConfig = {
  // Secret key used for signing JWT access tokens
  secret: process.env.AUTH_SECRET as string,

  // Expiration time for the JWT access token (e.g., "15m" for 15 minutes)
  secret_expires_in: process.env.AUTH_SECRET_EXPIRES_IN as string,

  // Secret key used for signing JWT refresh tokens
  refresh_secret: process.env.AUTH_REFRESH_SECRET as string,

  // Expiration time for the JWT refresh token (e.g., "24h" for 24 hours)
  refresh_secret_expires_in: process.env
    .AUTH_REFRESH_SECRET_EXPIRES_IN as string,

  // Thai Bulk SMS API configuration
  thai_bulk_api_key: process.env.THAI_BULK_API_KEY as string,
  thai_bulk_api_secret: process.env.THAI_BULK_API_SECRET as string,
  thai_bulk_url: process.env.THAI_BULK_URL as string,
  shippop_api_key: process.env.SHIPPOP_API_KEY as string,
  shippop_api_url: process.env.SHIPPOP_API_URL as string,
};

export default authConfig;
