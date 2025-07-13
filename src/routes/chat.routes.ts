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

      const [chatResult, messages] = await Promise.all([
        chatService.processMessage(session_id, message, user_id),
        chatHistoryRepository.findRecentBySessionId(session_id, 10),
      ]);

      console.log("chatResult", chatResult);

      console.log("messages", messages);

      const threadSummary = await summaryService.generateThreadSummary(
        messages.map((msg) => ({
          role: msg.message.role || "user",
          content: msg.message.content || JSON.stringify(msg.message),
        }))
      );

      console.log("threadSummary", threadSummary);

      const userEnhancedContext =
        await userEnhancedContextRepository.updateWithThreadSummary(
          user_id,
          threadSummary
        );

      console.log("userEnhancedContext", userEnhancedContext);

      // 4. Get all products embeddings by similarity using thread_summary_embedding + user_context_enhanced_embeddings
      if (!userEnhancedContext) {
        return reply.code(400).send({
          error: "User enhanced context not found",
        });
      }

      const recommendations =
        await recommendationService.generateRecommendations({
          userEnhancedContext: {
            id: userEnhancedContext.id,
            context_id: userEnhancedContext.context_id,
            user_id: userEnhancedContext.user_id,
            metadata: userEnhancedContext.metadata,
            output_base_prompt: userEnhancedContext.output_base_prompt,
            embeddings: userEnhancedContext.embeddings,
          },
          threadSummary,
          limit: 10,
          similarity_threshold: 0.5,
        });

      // generate response with custom system prompt, message and user_context_enhanced, thread_summary and recommendations products

      const response = await chatService.generateResponse(
        chatResult.threadSummary,
        userEnhancedContext,
        recommendations
      );

      reply.send({
        ...chatResult,
        response: response.response,
        context_summary: response.context_summary,
        recommendations: recommendations.recommendations,
      });
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
