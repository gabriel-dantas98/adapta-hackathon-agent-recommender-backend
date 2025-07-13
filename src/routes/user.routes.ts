import { FastifyInstance } from "fastify";
import { OnboardingDto, UpdateUserContextDto } from "../types/dtos";
import { userEnhancedContextRepository } from "../repositories/user-enhanced-context.repository";

export default async function userRoutes(fastify: FastifyInstance) {
  // User onboarding - create enhanced context
  fastify.post(
    "/onboarding",
    {
      schema: {
        body: OnboardingDto,
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              context_id: { type: "string" },
              user_id: { type: "string" },
              metadata: { type: "object" },
              output_base_prompt: { type: "object" },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = OnboardingDto.parse(request.body);
        const result = await userEnhancedContextRepository.create(data);

        reply.code(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get user context
  fastify.get(
    "/:userId/context",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
          required: ["userId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              context_id: { type: "string" },
              user_id: { type: "string" },
              metadata: { type: "object" },
              output_base_prompt: { type: "object" },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const result = await userEnhancedContextRepository.findByUserId(userId);

        if (!result) {
          reply.code(404).send({ error: "User context not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Update user context
  fastify.put(
    "/:userId/context",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
          required: ["userId"],
        },
        body: UpdateUserContextDto,
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              context_id: { type: "string" },
              user_id: { type: "string" },
              metadata: { type: "object" },
              output_base_prompt: { type: "object" },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const data = UpdateUserContextDto.parse(request.body);
        const result = await userEnhancedContextRepository.update(userId, data);

        if (!result) {
          reply.code(404).send({ error: "User context not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Update user context with thread summary
  fastify.put(
    "/:userId/context/thread-summary",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
          required: ["userId"],
        },
        body: {
          type: "object",
          properties: {
            thread_summary: { type: "string" },
            metadata: { type: "object" },
          },
          required: ["thread_summary"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              context_id: { type: "string" },
              user_id: { type: "string" },
              metadata: { type: "object" },
              output_base_prompt: { type: "object" },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { thread_summary, metadata } = request.body as {
          thread_summary: string;
          metadata?: Record<string, any>;
        };

        const result =
          await userEnhancedContextRepository.updateWithThreadSummary(
            userId,
            thread_summary,
            metadata
          );

        if (!result) {
          reply.code(404).send({ error: "User context not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Delete user context
  fastify.delete(
    "/:userId/context",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
          required: ["userId"],
        },
        response: {
          204: {
            type: "null",
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };

        // Check if exists first
        const exists = await userEnhancedContextRepository.findByUserId(userId);
        if (!exists) {
          reply.code(404).send({ error: "User context not found" });
          return;
        }

        await userEnhancedContextRepository.delete(userId);
        reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Find similar user contexts
  fastify.get(
    "/:userId/similar",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
          required: ["userId"],
        },
        querystring: {
          type: "object",
          properties: {
            threshold: { type: "number", default: 0.8 },
            limit: { type: "number", default: 5 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                context_id: { type: "string" },
                user_id: { type: "string" },
                metadata: { type: "object" },
                output_base_prompt: { type: "object" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
                similarity_score: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { threshold = 0.8, limit = 5 } = request.query as {
          threshold?: number;
          limit?: number;
        };

        const result = await userEnhancedContextRepository.findSimilarContexts(
          userId,
          threshold,
          limit
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Search user contexts by embedding
  fastify.post(
    "/search",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            query: { type: "string" },
            threshold: { type: "number", default: 0.7 },
            limit: { type: "number", default: 10 },
          },
          required: ["query"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                context_id: { type: "string" },
                user_id: { type: "string" },
                metadata: { type: "object" },
                output_base_prompt: { type: "object" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
                similarity_score: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          query,
          threshold = 0.7,
          limit = 10,
        } = request.body as {
          query: string;
          threshold?: number;
          limit?: number;
        };

        // Import embeddings service here to avoid circular dependency
        const { embeddingsService } = await import(
          "../services/embeddings.service"
        );

        const embedding = await embeddingsService.generateEmbedding(query);
        const result = await userEnhancedContextRepository.searchByEmbedding(
          embedding,
          threshold,
          limit
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Get all user contexts (admin endpoint)
  fastify.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                context_id: { type: "string" },
                user_id: { type: "string" },
                metadata: { type: "object" },
                output_base_prompt: { type: "object" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { limit = 50, offset = 0 } = request.query as {
          limit?: number;
          offset?: number;
        };

        const result = await userEnhancedContextRepository.findAll(
          limit,
          offset
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Get user context by context ID
  fastify.get(
    "/context/:contextId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            contextId: { type: "string" },
          },
          required: ["contextId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              context_id: { type: "string" },
              user_id: { type: "string" },
              metadata: { type: "object" },
              output_base_prompt: { type: "object" },
              created_at: { type: "string" },
              updated_at: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { contextId } = request.params as { contextId: string };
        const result = await userEnhancedContextRepository.findByContextId(
          contextId
        );

        if (!result) {
          reply.code(404).send({ error: "User context not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );
}
