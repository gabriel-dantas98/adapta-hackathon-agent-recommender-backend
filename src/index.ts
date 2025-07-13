import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env";
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";

// Import routes
import solutionOwnerRoutes from "./routes/solution-owner.routes";
import solutionProductRoutes from "./routes/solution-product.routes";
import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";
import recommendationRoutes from "./routes/recommendation.routes";

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
}).withTypeProvider<ZodTypeProvider>();

// Set validator and serializer compilers
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Adapta Hackathon Agent Recommender API",
        description:
          "API para recomendação de produtos usando embeddings e similaridade",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: "Development server",
        },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  // Register routes
  await fastify.register(solutionOwnerRoutes, {
    prefix: "/api/solution-owners",
  });
  await fastify.register(solutionProductRoutes, {
    prefix: "/api/solution-products",
  });
  await fastify.register(chatRoutes, { prefix: "/api/chat" });
  await fastify.register(userRoutes, { prefix: "/api/users" });
  await fastify.register(recommendationRoutes, {
    prefix: "/api/recommendations",
  });
}

// Health check route
fastify.get("/health", async (request, reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: env.NODE_ENV,
  };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;

  fastify.log.error(error);

  reply.status(statusCode).send({
    error: {
      message: error.message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();

    await fastify.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📚 API Documentation: http://localhost:${env.PORT}/docs`);
    console.log(`🔍 Health Check: http://localhost:${env.PORT}/health`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await fastify.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await fastify.close();
  process.exit(0);
});

start();
