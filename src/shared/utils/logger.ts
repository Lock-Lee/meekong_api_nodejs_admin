import { Request } from "express";

/**
 * Log Levels
 */
export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
}

/**
 * Log Context Interface
 */
export interface LogContext {
    userId?: string;
    requestId?: string;
    path?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    duration?: number;
    statusCode?: number;
    [key: string]: any;
}

/**
 * Structured Logger
 * In production, consider using winston, pino, or similar libraries
 */
export class Logger {
    private static isDevelopment = process.env.NODE_ENV !== 'production';
    private static logLevel = process.env.LOG_LEVEL || 'INFO';

    /**
     * Log an error
     */
    static error(message: string, error?: Error | any, context?: LogContext): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const logEntry = this.createLogEntry(LogLevel.ERROR, message, context, error);
            console.error(JSON.stringify(logEntry, null, this.isDevelopment ? 2 : 0));
        }
    }

    /**
     * Log a warning
     */
    static warn(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const logEntry = this.createLogEntry(LogLevel.WARN, message, context);
            console.warn(JSON.stringify(logEntry, null, this.isDevelopment ? 2 : 0));
        }
    }

    /**
     * Log information
     */
    static info(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const logEntry = this.createLogEntry(LogLevel.INFO, message, context);
            console.info(JSON.stringify(logEntry, null, this.isDevelopment ? 2 : 0));
        }
    }

    /**
     * Log debug information
     */
    static debug(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const logEntry = this.createLogEntry(LogLevel.DEBUG, message, context);
            console.debug(JSON.stringify(logEntry, null, this.isDevelopment ? 2 : 0));
        }
    }

    /**
     * Log HTTP request
     */
    static httpRequest(req: Request, duration?: number, statusCode?: number): void {
        const context: LogContext = {
            requestId: (req as any).requestId,
            path: req.path,
            method: req.method,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: (req as any).user?.id,
            duration,
            statusCode,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            params: Object.keys(req.params).length > 0 ? req.params : undefined,
        };

        const message = `${req.method} ${req.path}${statusCode ? ` - ${statusCode}` : ''}${duration ? ` (${duration}ms)` : ''}`;

        if (statusCode && statusCode >= 400) {
            this.warn(message, context);
        } else {
            this.info(message, context);
        }
    }

    /**
     * Log business operation
     */
    static business(operation: string, context?: LogContext): void {
        this.info(`Business Operation: ${operation}`, context);
    }

    /**
     * Log database operation
     */
    static database(operation: string, table?: string, duration?: number, context?: LogContext): void {
        const enhancedContext = {
            ...context,
            table,
            duration,
            type: 'database',
        };
        this.debug(`DB Operation: ${operation}${table ? ` on ${table}` : ''}${duration ? ` (${duration}ms)` : ''}`, enhancedContext);
    }

    /**
     * Log security event
     */
    static security(event: string, context?: LogContext): void {
        const enhancedContext = {
            ...context,
            type: 'security',
            timestamp: new Date().toISOString(),
        };
        this.warn(`Security Event: ${event}`, enhancedContext);
    }

    /**
     * Log performance metric
     */
    static performance(metric: string, value: number, unit: string = 'ms', context?: LogContext): void {
        const enhancedContext = {
            ...context,
            type: 'performance',
            metric,
            value,
            unit,
        };
        this.info(`Performance: ${metric} = ${value}${unit}`, enhancedContext);
    }

    /**
     * Create structured log entry
     */
    private static createLogEntry(
        level: LogLevel,
        message: string,
        context?: LogContext,
        error?: Error | any
    ): any {
        const logEntry: any = {
            timestamp: new Date().toISOString(),
            level,
            message,
            environment: process.env.NODE_ENV || 'development',
            service: 'meekong-api',
            version: process.env.npm_package_version || '1.0.0',
        };

        // Add context if provided
        if (context) {
            logEntry.context = context;
        }

        // Add error details if provided
        if (error) {
            logEntry.error = {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code,
                ...(error.meta && { meta: error.meta }),
            };
        }

        return logEntry;
    }

    /**
     * Check if we should log at this level
     */
    private static shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        const currentLevelIndex = levels.indexOf(this.logLevel as LogLevel);
        const messageLevelIndex = levels.indexOf(level);

        return messageLevelIndex <= currentLevelIndex;
    }

    /**
     * Create a child logger with preset context
     */
    static child(context: LogContext): ChildLogger {
        return new ChildLogger(context);
    }
}

/**
 * Child Logger with preset context
 */
export class ChildLogger {
    constructor(private context: LogContext) { }

    error(message: string, error?: Error | any, additionalContext?: LogContext): void {
        Logger.error(message, error, { ...this.context, ...additionalContext });
    }

    warn(message: string, additionalContext?: LogContext): void {
        Logger.warn(message, { ...this.context, ...additionalContext });
    }

    info(message: string, additionalContext?: LogContext): void {
        Logger.info(message, { ...this.context, ...additionalContext });
    }

    debug(message: string, additionalContext?: LogContext): void {
        Logger.debug(message, { ...this.context, ...additionalContext });
    }
}
