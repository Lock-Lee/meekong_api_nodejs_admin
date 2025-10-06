import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../../shared/utils/logger";

/**
 * Request Logging Middleware
 */
export class LoggingMiddleware {
    /**
     * Add request ID and start timing
     */
    static addRequestId = (req: Request, res: Response, next: NextFunction): void => {
        // Add unique request ID
        (req as any).requestId = uuidv4();
        (req as any).startTime = Date.now();

        // Add request ID to response headers
        res.setHeader('X-Request-ID', (req as any).requestId);

        next();
    };

    /**
     * Log incoming requests
     */
    static logRequest = (req: Request, res: Response, next: NextFunction): void => {
        const startTime = Date.now();
        (req as any).startTime = startTime;

        // Log incoming request
        Logger.httpRequest(req);

        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function (chunk?: any, encoding?: any, cb?: any) {
            const duration = Date.now() - startTime;

            // Log completed request
            Logger.httpRequest(req, duration, res.statusCode);

            // Log slow requests (> 1 second)
            if (duration > 1000) {
                Logger.performance('slow_request', duration, 'ms', {
                    requestId: (req as any).requestId,
                    path: req.path,
                    method: req.method,
                    statusCode: res.statusCode,
                });
            }

            // Call original end method
            originalEnd.call(res, chunk, encoding, cb);
        } as any;

        next();
    };

    /**
     * Log authentication events
     */
    static logAuth = (req: Request, res: Response, next: NextFunction): void => {
        const originalSend = res.send;

        res.send = function (body: any) {
            // Log authentication failures
            if (res.statusCode === 401) {
                Logger.security('authentication_failed', {
                    requestId: (req as any).requestId,
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
            }

            // Log successful login
            if (req.path.includes('/auth/login') && res.statusCode === 200) {
                Logger.security('user_login', {
                    requestId: (req as any).requestId,
                    userId: (req as any).user?.id,
                    ip: req.ip,
                });
            }

            // Log logout
            if (req.path.includes('/auth/logout') && res.statusCode === 200) {
                Logger.security('user_logout', {
                    requestId: (req as any).requestId,
                    userId: (req as any).user?.id,
                });
            }

            return originalSend.call(this, body);
        };

        next();
    };

    /**
     * Log business operations
     */
    static logBusinessOperation = (operation: string) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            const originalSend = res.send;

            res.send = function (body: any) {
                // Log successful business operations
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    Logger.business(operation, {
                        requestId: (req as any).requestId,
                        userId: (req as any).user?.id,
                        path: req.path,
                        method: req.method,
                    });
                }

                return originalSend.call(this, body);
            };

            next();
        };
    };

    /**
     * Log database operations
     */
    static logDatabaseOperation = (operation: string, table?: string) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            const startTime = Date.now();

            const originalSend = res.send;
            res.send = function (body: any) {
                const duration = Date.now() - startTime;

                Logger.database(operation, table, duration, {
                    requestId: (req as any).requestId,
                    userId: (req as any).user?.id,
                });

                return originalSend.call(this, body);
            };

            next();
        };
    };

    /**
     * Log errors with context
     */
    static logError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
        Logger.error('Request error', err, {
            requestId: (req as any).requestId,
            userId: (req as any).user?.id,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body,
            query: req.query,
            params: req.params,
        });

        next(err);
    };
}
