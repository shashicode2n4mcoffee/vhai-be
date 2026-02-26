/**
 * OpenAPI 3.0 spec for API documentation (served at /api/docs in development).
 *
 * Error responses (4xx/5xx): standard shape { error: string } with optional
 * upgradeUrl (402), requestId (when available), and stack (dev only). See ErrorResponse schema.
 */
export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Interview AI API",
    version: "1.0.0",
    description: "REST API for VocalHireAI. All error responses (4xx/5xx) use the same shape: `error` (required), optional `upgradeUrl` (402), optional `requestId` for log correlation.",
  },
  servers: [{ url: "/api", description: "API base" }],
  paths: {
    "/health": {
      get: {
        summary: "Liveness",
        responses: {
          200: { description: "OK" },
          default: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/health/ready": {
      get: {
        summary: "Readiness (DB ping)",
        responses: {
          200: { description: "OK" },
          503: { description: "DB unavailable", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/config/public": {
      get: {
        summary: "Public config (no auth)",
        responses: { 200: { description: "geminiModel, geminiReportModel" } },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login",
        requestBody: { content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } },
        responses: {
          200: { description: "User + tokens" },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh access token (cookie or body)",
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { refreshToken: { type: "string" } } } } } },
        responses: {
          200: { description: "New tokens" },
          401: { description: "Invalid refresh token", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Current user (requires auth)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User profile" },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/errors/log": {
      post: {
        summary: "Log client error (optional auth)",
        requestBody: { content: { "application/json": { schema: { type: "object", required: ["message"], properties: { message: { type: "string", maxLength: 2000 }, details: { type: "string" }, source: { type: "string" } } } } } },
        responses: {
          201: { description: "Logged" },
          400: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/interviews": {
      get: {
        summary: "List interviews (auth)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Paginated list" }, 401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } } },
      },
      post: {
        summary: "Create interview (auth)",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Created" }, 401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }, 402: { description: "Insufficient credits", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } } } },
      },
    },
    "/interviews/{id}": {
      get: {
        summary: "Get interview by ID (auth)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Interview" }, 401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }, 404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } } },
      },
      put: {
        summary: "Update interview (auth)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Updated" }, 401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ErrorResponse: {
        description: "Standard error body for all 4xx/5xx responses. Clients can rely on `error` and optionally use `requestId` for log correlation.",
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string", description: "Human-readable error message" },
          upgradeUrl: { type: "string", description: "Present only on 402 (e.g. /pricing)" },
          requestId: { type: "string", description: "Request ID for server-side log correlation" },
        },
      },
    },
  },
};
