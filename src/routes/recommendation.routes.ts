import { FastifyInstance } from "fastify";
import { RecommendationRequestDto } from "../types/dtos";
import { recommendationService } from "../services/recommendation.service";

export default async function recommendationRoutes(fastify: FastifyInstance) {
  // Generate recommendations based on user context and thread
  fastify.post("/", async (request, reply) => {
    try {
      const data = RecommendationRequestDto.parse(request.body);
      const result = await recommendationService.generateRecommendations(data);

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: error.message });
    }
  });

  // Search products by text query
  fastify.post("/search", async (request, reply) => {
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
  });

  // Find similar products
  fastify.get("/similar/:productId", async (request, reply) => {
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
  });
}
