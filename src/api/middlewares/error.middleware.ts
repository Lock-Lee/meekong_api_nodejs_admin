import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { BusinessError } from "../../shared/errors/business.errors";
import Send from "../../shared/utils/response.utils";
import { Logger } from "../../shared/utils/logger";

/**
 * Global Error Handling Middleware
 * This middleware catches all errors and formats them consistently
 */
export class ErrorMiddleware {
    /**
     * Global error handler - must be the last middleware
     */
    static handle = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
        Logger.error("Global Error Handler:", {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
            requestId: (req as Request & { id?: string }).id
        });

        // Handle Business Logic Errors
        if (err instanceof BusinessError) {
            Send.error(res, null, err.message, err.statusCode);
            return;
        }

        // Handle Zod Validation Errors
        if (err instanceof ZodError) {
            const validationErrors = err.errors.map(error => ({
                field: error.path.join('.'),
                message: error.message,
                value: error.code,
            }));

            Send.error(res, validationErrors, "Validation failed", 400);
            return;
        }

        // Handle Prisma Errors
        if (err instanceof PrismaClientKnownRequestError) {
            const prismaError = ErrorMiddleware.handlePrismaError(err);
            Send.error(res, null, prismaError.message, prismaError.statusCode);
            return;
        }

        if (err instanceof PrismaClientValidationError) {
            Send.error(res, null, "Database validation error", 400);
            return;
        }

        // Handle JWT Errors
        if (err.name === 'JsonWebTokenError') {
            Send.error(res, null, "Invalid token", 401);
            return;
        }

        if (err.name === 'TokenExpiredError') {
            Send.error(res, null, "Token expired", 401);
            return;
        }

        // Handle File Upload Errors
        if (err.message.includes('File too large')) {
            Send.error(res, null, "File size too large", 413);
            return;
        }

        if (err.message.includes('Unexpected field')) {
            Send.error(res, null, "Unexpected file field", 400);
            return;
        }

        // Handle CORS Errors
        if (err.message.includes('CORS')) {
            Send.error(res, null, "CORS policy violation", 403);
            return;
        }

        // Handle Rate Limiting Errors
        if (err.message.includes('Too many requests')) {
            Send.error(res, null, "Too many requests", 429);
            return;
        }

        // Handle Omise Payment Errors
        if (err.message.includes('Failed to create payment source') ||
            err.message.includes('Failed to create PromptPay payment') ||
            err.message.includes('Failed to create Mobile Banking payment') ||
            err.message.includes('Failed to create charge') ||
            err.message.includes('Failed to create token')) {
            Send.error(res, null, err.message, 400);
            return;
        }

        // Handle validation errors from our payment system
        if (err.message.includes('is required') ||
            err.message.includes('Invalid platformType') ||
            err.message.includes('Unsupported payment type')) {
            Send.error(res, null, err.message, 400);
            return;
        }

        // Generic 500 Internal Server Error
        Send.error(res, null, "Internal server error", 500);
    };

    /**
     * Handle Prisma-specific errors
     */
    private static handlePrismaError(err: PrismaClientKnownRequestError): { message: string; statusCode: number } {
        switch (err.code) {
            case 'P2000':
                return { message: "Value too long for the column", statusCode: 400 };

            case 'P2001':
                return { message: "Record not found", statusCode: 404 };

            case 'P2002':
                const target = err.meta?.target as string[] | undefined;
                const field = target?.[0] || 'field';
                return { message: `${field} already exists`, statusCode: 409 };

            case 'P2003':
                return { message: "Foreign key constraint failed", statusCode: 400 };

            case 'P2004':
                return { message: "Constraint failed", statusCode: 400 };

            case 'P2005':
                return { message: "Invalid value for field", statusCode: 400 };

            case 'P2006':
                return { message: "Invalid value provided", statusCode: 400 };

            case 'P2007':
                return { message: "Data validation error", statusCode: 400 };

            case 'P2008':
                return { message: "Failed to parse query", statusCode: 400 };

            case 'P2009':
                return { message: "Failed to validate query", statusCode: 400 };

            case 'P2010':
                return { message: "Raw query failed", statusCode: 400 };

            case 'P2011':
                return { message: "Null constraint violation", statusCode: 400 };

            case 'P2012':
                return { message: "Missing required value", statusCode: 400 };

            case 'P2013':
                return { message: "Missing required argument", statusCode: 400 };

            case 'P2014':
                return { message: "Relation violation", statusCode: 400 };

            case 'P2015':
                return { message: "Related record not found", statusCode: 404 };

            case 'P2016':
                return { message: "Query interpretation error", statusCode: 400 };

            case 'P2017':
                return { message: "Records not connected", statusCode: 400 };

            case 'P2018':
                return { message: "Required connected records not found", statusCode: 404 };

            case 'P2019':
                return { message: "Input error", statusCode: 400 };

            case 'P2020':
                return { message: "Value out of range", statusCode: 400 };

            case 'P2021':
                return { message: "Table does not exist", statusCode: 500 };

            case 'P2022':
                return { message: "Column does not exist", statusCode: 500 };

            case 'P2023':
                return { message: "Inconsistent column data", statusCode: 500 };

            case 'P2024':
                return { message: "Connection timed out", statusCode: 408 };

            case 'P2025':
                return { message: "Record not found", statusCode: 404 };

            case 'P2026':
                return { message: "Unsupported feature", statusCode: 501 };

            case 'P2027':
                return { message: "Multiple errors occurred", statusCode: 400 };

            default:
                return { message: "Database error occurred", statusCode: 500 };
        }
    }

    /**
     * 404 Not Found Middleware
     * This should be placed before the error handler
     */
    static notFound = (req: Request, res: Response, _next: NextFunction): void => {
        Send.error(res, null, `Route ${req.method} ${req.path} not found`, 404);
    };

    /**
     * Async error wrapper for route handlers
     * Usage: router.get('/path', asyncErrorHandler(controllerMethod))
     */
    static asyncErrorHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
        return (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    };
}
