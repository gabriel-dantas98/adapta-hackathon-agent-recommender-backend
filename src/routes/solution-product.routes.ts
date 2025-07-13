import { FastifyInstance } from "fastify";
import {
  CreateSolutionProductDto,
  UpdateSolutionProductDto,
} from "../types/dtos";
import { solutionProductRepository } from "../repositories/solution-product.repository";

export default async function solutionProductRoutes(fastify: FastifyInstance) {
  // Create solution product
  fastify.post(
    "/",
    {
      schema: {
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              product_id: { type: "string" },
              owner_id: { type: "string", nullable: true },
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
        const data = CreateSolutionProductDto.parse(request.body);
        const result = await solutionProductRepository.create(data);

        reply.code(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get all solution products
  fastify.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 },
            owner_id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                product_id: { type: "string" },
                owner_id: { type: "string", nullable: true },
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
        const {
          limit = 50,
          offset = 0,
          owner_id,
        } = request.query as {
          limit?: number;
          offset?: number;
          owner_id?: string;
        };

        let result;
        if (owner_id) {
          result = await solutionProductRepository.findByOwnerId(
            owner_id,
            limit,
            offset
          );
        } else {
          result = await solutionProductRepository.findAll(limit, offset);
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Get solution product by ID
  fastify.get(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              product_id: { type: "string" },
              owner_id: { type: "string", nullable: true },
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
        const { id } = request.params as { id: string };
        const result = await solutionProductRepository.findById(id);

        if (!result) {
          reply.code(404).send({ error: "Solution product not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Get solution product by product ID
  fastify.get(
    "/product/:productId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            productId: { type: "string" },
          },
          required: ["productId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              product_id: { type: "string" },
              owner_id: { type: "string", nullable: true },
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
        const { productId } = request.params as { productId: string };
        const result = await solutionProductRepository.findByProductId(
          productId
        );

        if (!result) {
          reply.code(404).send({ error: "Solution product not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Update solution product
  fastify.put(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },

        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              product_id: { type: "string" },
              owner_id: { type: "string", nullable: true },
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
        const { id } = request.params as { id: string };
        const data = UpdateSolutionProductDto.parse(request.body);
        const result = await solutionProductRepository.update(id, data);

        if (!result) {
          reply.code(404).send({ error: "Solution product not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Delete solution product
  fastify.delete(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
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
        const { id } = request.params as { id: string };

        // Check if exists first
        const exists = await solutionProductRepository.findById(id);
        if (!exists) {
          reply.code(404).send({ error: "Solution product not found" });
          return;
        }

        await solutionProductRepository.delete(id);
        reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    }
  );

  // Search solution products by embedding
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
                product_id: { type: "string" },
                owner_id: { type: "string", nullable: true },
                metadata: { type: "object" },
                output_base_prompt: { type: "object" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
                similarity_score: { type: "number" },
                owner_info: { type: "object" },
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
        const result = await solutionProductRepository.findWithOwnerInfo(
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
}
