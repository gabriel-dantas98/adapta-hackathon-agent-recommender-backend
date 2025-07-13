import { FastifyInstance } from "fastify";
import { ChatMessageDto } from "../types/dtos";
import { chatService } from "../services/chat.service";
import { recommendationService } from "../services/recommendation.service";
import { userEnhancedContextRepository } from "../repositories/user-enhanced-context.repository";
import { chatHistoryRepository } from "../repositories/chat-history.repository";
import { embeddingsService } from "../services/embeddings.service";
import { summaryService } from "../services/summary.service";

export default async function chatRoutes(fastify: FastifyInstance) {
  // Send message and process with recommendations
  fastify.post("/messages", async (request, reply) => {
    try {
      const { session_id, message, user_id } = request.body as {
        session_id: string;
        message: Record<string, any>;
        user_id: string;
      };

      // 1. Process the message first
      message.user_id = user_id;
      const chatResult = await chatService.processMessage(
        session_id,
        message,
        user_id
      );

      // 2. Refresh user_context_enhanced embeddings
      const userContext = await userEnhancedContextRepository.findByUserId(
        user_id
      );

      console.log(
        `USER_ID: ${user_id} USER_CONTEXT: ${JSON.stringify(userContext)}`
      );

      if (userContext) {
        await userEnhancedContextRepository.updateWithThreadSummary(
          user_id,
          chatResult.threadSummary
        );
      }

      // 3. Refresh thread context embeddings
      const recentMessages = await chatHistoryRepository.findRecentBySessionId(
        session_id,
        10
      );

      let threadEmbedding: number[] | null = null;
      if (recentMessages.length > 0) {
        const chatMessages = recentMessages.map((msg) => ({
          role: msg.message.role || "user",
          content: msg.message.content || JSON.stringify(msg.message),
        }));

        threadEmbedding = await embeddingsService.generateThreadEmbedding(
          chatMessages,
          chatResult.threadSummary
        );
      }

      // 4. Get all products by similarity using thread context and user_context_enhanced embeddings
      // const recommendations =
      //   await recommendationService.generateRecommendations({
      //     user_id,
      //     session_id,
      //     limit: 10,
      //     similarity_threshold: 0.7,
      //   });

      // generate response with custom system prompt, message and user_context_enhanced, thread_summary and recommendations products

      const response = await chatService.generateResponse(
        chatResult.threadSummary,
        userContext
        // recommendations
      );

      reply.send({
        ...chatResult,
        response: response.response,
        recommendations_used: response.recommendations_used,
        context_summary: response.context_summary,
        // recommendations: recommendations.recommendations,
        threadEmbedding: threadEmbedding ? threadEmbedding.slice(0, 5) : null, // Only send first 5 dimensions for debugging
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Send message and process (original endpoint)
  fastify.post("/message", async (request, reply) => {
    try {
      const { session_id, message, user_id } = request.body as {
        session_id: string;
        message: Record<string, any>;
        user_id: string;
      };

      // we need to get all messages from the session
      // add user_id to the message
      message.user_id = user_id;

      const result = await chatService.processMessage(
        session_id,
        message,
        user_id
      );

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Get thread history
  fastify.get("/history/:sessionId", async (request, reply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const { limit = 50, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      const result = await chatService.getThreadHistory(
        sessionId,
        limit,
        offset
      );

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Get user threads
  fastify.get("/threads/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const result = await chatService.getUserThreads(userId);

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Search messages
  fastify.post("/search", async (request, reply) => {
    try {
      const {
        query,
        session_id,
        limit = 20,
      } = request.body as {
        query: string;
        session_id?: string;
        limit?: number;
      };

      const result = await chatService.searchMessages(query, session_id, limit);

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Analyze conversation patterns
  fastify.get("/patterns/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { days_back = 30 } = request.query as { days_back?: number };

      const result = await chatService.analyzeConversationPatterns(
        userId,
        days_back
      );

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Clean up old messages
  fastify.delete("/cleanup", async (request, reply) => {
    try {
      const { days_old = 90 } = request.query as { days_old?: number };

      const deletedCount = await chatService.cleanupOldMessages(days_old);

      reply.send({ deleted_count: deletedCount });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Get recent messages from thread
  fastify.get(
    "/recent/:sessionId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            sessionId: { type: "string" },
          },
          required: ["sessionId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 10 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                session_id: { type: "string" },
                message: { type: "object" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = request.params as { sessionId: string };
        const { limit = 10 } = request.query as { limit?: number };

        const { chatHistoryRepository } = await import(
          "../repositories/chat-history.repository"
        );
        const result = await chatHistoryRepository.findRecentBySessionId(
          sessionId,
          limit
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );

  // Get message count for session
  fastify.get(
    "/count/:sessionId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            sessionId: { type: "string" },
          },
          required: ["sessionId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              count: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = request.params as { sessionId: string };

        const { chatHistoryRepository } = await import(
          "../repositories/chat-history.repository"
        );
        const count = await chatHistoryRepository.getMessageCount(sessionId);

        reply.send({ count });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );
}
