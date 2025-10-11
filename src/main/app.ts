import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import appConfig from "../shared/config/app.config";
import mainRouter from "../api/routes/index";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../shared/config/swagger.config";
import { ErrorMiddleware } from "../api/middlewares/error.middleware";
import { LoggingMiddleware } from "../api/middlewares/logging.middleware";
import { Logger } from "../shared/utils/logger";
import { createServer } from 'http';
import { container } from './inversify.config';
import { TYPES } from '@shared/types/service.types';
import { SocketService } from '@shared/infra/socket/socket.service';

import "../main/inversify.config"; // Initialize container

class App {
  private app: Express;

  constructor() {
    this.app = express();

    this.initMiddlewares();
    this.initRoutes();
  }

  private initMiddlewares() {
    // Request ID and timing middleware (first)
    this.app.use(LoggingMiddleware.addRequestId);

    // Basic Express middleware
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: [
          "http://localhost:3000",
          "http://localhost:5173",
          process.env.API_BASE || "http://18.143.121.54",
          "http://127.0.0.1:5500", // for Socket.IO testing
          "http://localhost:5500", // for Socket.IO testing
          // "https://mywebsite.com", // your production url optional
        ],
        methods: ["GET", "POST", "DELETE", "PATCH"],
        credentials: true,
      })
    );
    this.app.use(express.static("public"));

    // File upload middleware
    this.app.use(fileUpload({
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
      abortOnLimit: true,
      responseOnLimit: "File size too large"
    }));

    // Static files and URL encoding
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, "../public")));

    // Logging middleware
    if (process.env.NODE_ENV !== 'production') {
      this.app.use(morgan("dev"));
    }
    this.app.use(LoggingMiddleware.logRequest);
    this.app.use(LoggingMiddleware.logAuth);
  }

  private initRoutes() {
    // Health check endpoint for Docker and load balancers
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
      });
    });

    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    this.app.use("/api", mainRouter);

    // 404 handler - must be before error handler
    this.app.use(ErrorMiddleware.notFound);

    // Global error handler - must be last
    this.app.use(ErrorMiddleware.handle);
  }

  public getApp(): Express {
    return this.app;
  }

  public start() {
    const { port, host } = appConfig;

    const httpServer = createServer(this.app);
    const socketService = container.get<SocketService>(TYPES.SocketService);
    socketService.initialize(httpServer);

    httpServer.listen(port, host, () => {
      Logger.info(`🚀 Meekong API Server started successfully`, {
        host,
        port,
        apiBase: appConfig.apiBase,
        environment: process.env.NODE_ENV || 'development',
        apiDocs: `${appConfig.apiBase}/api-docs`,
      });

      // For backward compatibility, keep console.log for development
      if (process.env.NODE_ENV !== 'production') {
        const serverUrl = appConfig.apiBase || `http://${host}:${port}`;
        // eslint-disable-next-line no-console
        console.log(`🌟 Server is running on ${serverUrl}`);
        // eslint-disable-next-line no-console
        console.log(`📚 API Documentation: ${serverUrl}/api-docs`);
      }
    });
  }
}

export default App;
