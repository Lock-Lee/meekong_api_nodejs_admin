const portStr = process.env.APP_PORT ?? process.env.PORT ?? "3000";
const port = portStr ? parseInt(portStr, 10) : 3000;

const appConfig = {
  // Host for binding server (always use localhost for local development)
  host: process.env.APP_HOST || "localhost",
  port: port,
  // API Base URL for external access and CORS
  apiBase: process.env.API_BASE || `http://localhost:${port}`,
};

export default appConfig;
