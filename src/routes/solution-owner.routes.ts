import { FastifyInstance } from "fastify";
import {
  CreateSolutionOwnerDto,
  UpdateSolutionOwnerDto,
  CreateSolutionOwnerInput,
} from "../types/dtos";
import { solutionOwnerRepository } from "../repositories/solution-owner.repository";
import {
  startCrawlProcess,
  summarySchema,
  waitForCrawlResult,
} from "@/lib/crawl";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { openai } from "@/lib/openai";

export default async function solutionOwnerRoutes(fastify: FastifyInstance) {
  // Create solution owner
  fastify.post(
    "/",
    {
      schema: {
        body: CreateSolutionOwnerDto,
      },
    },
    async (request, reply) => {
      try {
        const result = await solutionOwnerRepository.create(
          request.body as CreateSolutionOwnerInput,
        );
        reply.code(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  // Given a website url, crawl it and return the application title, summary and possible images.
  fastify.post("/crawl", async (request, reply) => {
    const { url } = request.body as { url: string };

    const crawlId = await startCrawlProcess(url);
    const crawlResult = await waitForCrawlResult(crawlId);
    const pagesData = crawlResult.data;

    const structuredModel = openai.withStructuredOutput(summarySchema);

    const LLMResponse = await structuredModel.invoke([
      new SystemMessage({
        content:
          "Create a summary of the scraping content below. Focus on detecting the core of the business, and it solutions. Get only the images that represent the business logo, especially the favicon. From the favicon, extract the primary color and the secondary color from the ",
      }),
      new HumanMessage({
        content: JSON.stringify(pagesData),
      }),
    ]);
    reply.send(LLMResponse);
  });

  // Get all solution owners
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
                company_id: { type: "string" },
                company_name: { type: "string" },
                domain: { type: "string", nullable: true },
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
        const result = await solutionOwnerRepository.findAll(limit, offset);

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // Get solution owner by ID
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
              company_id: { type: "string" },
              company_name: { type: "string" },
              domain: { type: "string", nullable: true },
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
        const result = await solutionOwnerRepository.findById(id);

        if (!result) {
          reply.code(404).send({ error: "Solution owner not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // Get solution owner by company ID
  fastify.get(
    "/company/:companyId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            companyId: { type: "string" },
          },
          required: ["companyId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              company_id: { type: "string" },
              company_name: { type: "string" },
              domain: { type: "string", nullable: true },
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
        const { companyId } = request.params as { companyId: string };
        const result = await solutionOwnerRepository.findByCompanyId(companyId);

        if (!result) {
          reply.code(404).send({ error: "Solution owner not found" });
          return;
        }

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // Update solution owner
  fastify.put("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = UpdateSolutionOwnerDto.parse(request.body);
      const result = await solutionOwnerRepository.update(id, data);

      if (!result) {
        reply.code(404).send({ error: "Solution owner not found" });
        return;
      }

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: error.message });
    }
  });

  // Delete solution owner
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
        const exists = await solutionOwnerRepository.findById(id);
        if (!exists) {
          reply.code(404).send({ error: "Solution owner not found" });
          return;
        }

        await solutionOwnerRepository.delete(id);
        reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // Search solution owners by embedding
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
                company_id: { type: "string" },
                company_name: { type: "string" },
                domain: { type: "string", nullable: true },
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
        const result = await solutionOwnerRepository.searchByEmbedding(
          embedding,
          threshold,
          limit,
        );

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    },
  );
}
