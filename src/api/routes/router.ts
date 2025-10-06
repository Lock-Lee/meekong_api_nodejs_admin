/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, Request, Response, NextFunction } from "express";
import { ErrorMiddleware } from "../middlewares/error.middleware";

export interface RouteConfig {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  middlewares?: ((req: Request, res: Response, next: NextFunction) => void)[];
  handler: (req: Request, res: Response, next?: NextFunction) => any;
}

abstract class BaseRouter {
  public router: Router;
  private _initialized = false;

  constructor() {
    this.router = Router();
    // Defer initialization to allow child constructor to complete
    process.nextTick(() => {
      if (!this._initialized) {
        this.initializeRoutes();
        this._initialized = true;
      }
    });
  }

  protected abstract routes(): RouteConfig[];

  private initializeRoutes() {
    this.routes().forEach((route) => {
      // Wrap handler with async error handling
      const wrappedHandler = ErrorMiddleware.asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
        return await Promise.resolve(route.handler(req, res, next));
      });

      if (route.middlewares) {
        this.router[route.method](
          route.path,
          ...route.middlewares,
          wrappedHandler
        );
      } else {
        this.router[route.method](route.path, wrappedHandler);
      }
    });
  }
}

export default BaseRouter;
