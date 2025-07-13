import { FastifyInstance } from "fastify";
import { ChatMessageDto } from "../types/dtos";
import { chatService } from "../services/chat.service";

export default async function chatRoutes(fastify: FastifyInstance) {
  // Send message and process
  fastify.post(
    "/message",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            session_id: { type: "string" },
            message: { type: "object" },
            user_id: { type: "string" },
          },
          required: ["session_id", "message"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message_id: { type: "number" },
              thread_summary: { type: "string" },
              user_context_updated: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { session_id, message, user_id } = request.body as {
          session_id: string;
          message: Record<string, any>;
          user_id?: string;
        };

        const result = await chatService.processMessage(
          session_id,
          message,
          user_id
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get thread history
  fastify.get(
    "/history/:sessionId",
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
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    message: { type: "object" },
                    timestamp: { type: "string" },
                  },
                },
              },
              total: { type: "number" },
              summary: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
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
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Get user threads
  fastify.get(
    "/threads/:userId",
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
            days_back: { type: "number", default: 30 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                session_id: { type: "string" },
                message_count: { type: "number" },
                last_activity: { type: "string" },
                summary: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { days_back = 30 } = request.query as { days_back?: number };

        const result = await chatService.getUserThreads(userId, days_back);

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Search messages
  fastify.post(
    "/search",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            query: { type: "string" },
            session_id: { type: "string" },
            limit: { type: "number", default: 20 },
          },
          required: ["query"],
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
                relevance_score: { type: "number" },
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
          session_id,
          limit = 20,
        } = request.body as {
          query: string;
          session_id?: string;
          limit?: number;
        };

        const result = await chatService.searchMessages(
          query,
          session_id,
          limit
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Analyze conversation patterns
  fastify.get(
    "/patterns/:userId",
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
            days_back: { type: "number", default: 30 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              total_messages: { type: "number" },
              active_sessions: { type: "number" },
              avg_messages_per_session: { type: "number" },
              common_topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topic: { type: "string" },
                    frequency: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
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
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Clean up old messages
  fastify.delete(
    "/cleanup",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            days_old: { type: "number", default: 90 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              deleted_count: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { days_old = 90 } = request.query as { days_old?: number };

        const deletedCount = await chatService.cleanupOldMessages(days_old);

        reply.send({ deleted_count: deletedCount });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

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
        reply.code(500).send({ error: error.message });
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
        reply.code(500).send({ error: error.message });
      }
    }
  );
}
