import { FastifyInstance } from "fastify";
import { RecommendationRequestDto } from "../types/dtos";
import { recommendationService } from "../services/recommendation.service";

export default async function recommendationRoutes(fastify: FastifyInstance) {
  // Generate recommendations based on user context and thread
  fastify.post(
    "/",
    {
      schema: {
        body: RecommendationRequestDto,
        response: {
          200: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    similarity_score: { type: "number" },
                    metadata: { type: "object" },
                    output_base_prompt: { type: "object" },
                    owner_info: {
                      type: "object",
                      properties: {
                        company_name: { type: "string" },
                        domain: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
              total: { type: "number" },
              user_context_summary: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = RecommendationRequestDto.parse(request.body);
        const result = await recommendationService.generateRecommendations(
          data
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Search products by text query
  fastify.post(
    "/search",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number", default: 10 },
            similarity_threshold: { type: "number", default: 0.7 },
          },
          required: ["query"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    similarity_score: { type: "number" },
                    metadata: { type: "object" },
                    output_base_prompt: { type: "object" },
                    owner_info: {
                      type: "object",
                      properties: {
                        company_name: { type: "string" },
                        domain: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
              total: { type: "number" },
              user_context_summary: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          query,
          limit = 10,
          similarity_threshold = 0.7,
        } = request.body as {
          query: string;
          limit?: number;
          similarity_threshold?: number;
        };

        const result = await recommendationService.searchProductsByText(
          query,
          limit,
          similarity_threshold
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Find similar products
  fastify.get(
    "/similar/:productId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            productId: { type: "string" },
          },
          required: ["productId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 5 },
            similarity_threshold: { type: "number", default: 0.8 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    similarity_score: { type: "number" },
                    metadata: { type: "object" },
                    output_base_prompt: { type: "object" },
                    owner_info: {
                      type: "object",
                      properties: {
                        company_name: { type: "string" },
                        domain: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
              total: { type: "number" },
              user_context_summary: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { productId } = request.params as { productId: string };
        const { limit = 5, similarity_threshold = 0.8 } = request.query as {
          limit?: number;
          similarity_threshold?: number;
        };

        const result = await recommendationService.findSimilarProducts(
          productId,
          limit,
          similarity_threshold
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Analyze user recommendation patterns
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
              top_categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    count: { type: "number" },
                  },
                },
              },
              average_similarity_threshold: { type: "number" },
              recommendation_frequency: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { days_back = 30 } = request.query as { days_back?: number };

        const result =
          await recommendationService.analyzeUserRecommendationPatterns(
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
}
