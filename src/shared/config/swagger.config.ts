import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Meekong API",
      version: "1.0.0",
      description: "API documentation for the Meekong project",
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "src/api/routes/*.ts", // V1 routes
    "src/api/routes/v2/*.ts", // V2 routes
  ], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
