export class BusinessError extends Error {
    public readonly code: string;
    public readonly statusCode: number;

    constructor(
        message: string,
        codeOrStatusCode?: string | number,
        statusCode?: number
    ) {
        super(message);
        this.name = "BusinessError";

        // Support both patterns:
        // new BusinessError("message", "ERROR_CODE", 400) - original pattern
        // new BusinessError("message", 400) - new convenience pattern
        if (typeof codeOrStatusCode === 'number') {
            // New pattern: status code as second parameter
            this.statusCode = codeOrStatusCode;
            this.code = this.generateCodeFromStatusCode(codeOrStatusCode);
        } else if (typeof codeOrStatusCode === 'string') {
            // Original pattern: code as second parameter
            this.code = codeOrStatusCode;
            this.statusCode = statusCode ?? 400;
        } else {
            // Default pattern: no second parameter
            this.code = "BUSINESS_ERROR";
            this.statusCode = 400;
        }
    }

    /**
     * Generate a standardized error code from status code
     */
    private generateCodeFromStatusCode(statusCode: number): string {
        switch (statusCode) {
            case 400: return "BAD_REQUEST";
            case 401: return "UNAUTHORIZED";
            case 403: return "FORBIDDEN";
            case 404: return "NOT_FOUND";
            case 409: return "CONFLICT";
            case 422: return "UNPROCESSABLE_ENTITY";
            case 500: return "INTERNAL_SERVER_ERROR";
            default: return "BUSINESS_ERROR";
        }
    }
}

export class ValidationError extends BusinessError {
    constructor(message: string, public readonly field?: string) {
        super(message, "VALIDATION_ERROR", 400);
        this.name = "ValidationError";
    }
}

export class NotFoundError extends BusinessError {
    constructor(resource: string, id?: string) {
        const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        super(message, "NOT_FOUND", 404);
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends BusinessError {
    constructor(message: string = "Unauthorized access") {
        super(message, "UNAUTHORIZED", 401);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends BusinessError {
    constructor(message: string = "Forbidden access") {
        super(message, "FORBIDDEN", 403);
        this.name = "ForbiddenError";
    }
}

export class ConflictError extends BusinessError {
    constructor(message: string) {
        super(message, "CONFLICT", 409);
        this.name = "ConflictError";
    }
}

// Item-specific errors
export class MaxTagsExceededError extends ValidationError {
    constructor() {
        super("Maximum 3 tags allowed per item", "tags");
    }
}

export class InvalidShippingDurationError extends ValidationError {
    constructor() {
        super("Shipping duration must be between 1-30 days", "shippingDuration");
    }
}

export class ItemNotOwnedError extends ForbiddenError {
    constructor() {
        super("You can only modify your own items");
    }
}

export class InvalidItemVariantError extends ValidationError {
    constructor(message: string) {
        super(message, "itemVariants");
    }
}

export class FileUploadError extends BusinessError {
    constructor(message: string) {
        super(message, "FILE_UPLOAD_ERROR", 400);
        this.name = "FileUploadError";
    }
}

export class InvalidFileTypeError extends FileUploadError {
    constructor() {
        super("Only JPEG, PNG, and WebP images are allowed");
    }
}

export class FileSizeExceededError extends FileUploadError {
    constructor() {
        super("File size must be less than 5MB");
    }
}
