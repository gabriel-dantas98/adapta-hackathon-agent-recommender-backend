import { supabase, handleDatabaseError } from "../config/database";
import { Database } from "../types/database";
import {
  CreateSolutionProductInput,
  UpdateSolutionProductInput,
  SolutionProductResponse,
} from "../types/dtos";
import { embeddingsService } from "../services/embeddings.service";

type SolutionProductRow =
  Database["public"]["Tables"]["solutions_owner_products"]["Row"];
type SolutionProductInsert =
  Database["public"]["Tables"]["solutions_owner_products"]["Insert"];
type SolutionProductUpdate =
  Database["public"]["Tables"]["solutions_owner_products"]["Update"];

export class SolutionProductRepository {
  private tableName = "solutions_owner_products";

  async create(
    data: CreateSolutionProductInput
  ): Promise<SolutionProductResponse> {
    try {
      // Gera embeddings para o produto
      const embeddings = await embeddingsService.generateEmbeddingFromMetadata(
        data.metadata,
        data.output_base_prompt
      );

      const insertData: SolutionProductInsert = {
        ...data,
        embeddings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return this.formatResponse(result);
    } catch (error) {
      handleDatabaseError(error, "create solution product");
      throw error;
    }
  }

  async findById(id: string): Promise<SolutionProductResponse | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return this.formatResponse(data);
    } catch (error) {
      handleDatabaseError(error, "find solution product by id");
      throw error;
    }
  }

  async findByProductId(
    productId: string
  ): Promise<SolutionProductResponse | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("product_id", productId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return this.formatResponse(data);
    } catch (error) {
      handleDatabaseError(error, "find solution product by product id");
      throw error;
    }
  }

  async findByOwnerId(
    ownerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SolutionProductResponse[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "find solution products by owner id");
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<SolutionProductResponse[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "find all solution products");
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateSolutionProductInput
  ): Promise<SolutionProductResponse | null> {
    try {
      let embeddings: number[] | undefined;

      // Regenera embeddings se metadata ou output_base_prompt foram alterados
      if (data.metadata || data.output_base_prompt) {
        const current = await this.findById(id);
        if (!current) {
          return null;
        }

        const updatedMetadata = data.metadata || current.metadata;
        const updatedPrompt =
          data.output_base_prompt || current.output_base_prompt;

        embeddings = await embeddingsService.generateEmbeddingFromMetadata(
          updatedMetadata,
          updatedPrompt
        );
      }

      const updateData: SolutionProductUpdate = {
        ...data,
        ...(embeddings && { embeddings }),
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return this.formatResponse(result);
    } catch (error) {
      handleDatabaseError(error, "update solution product");
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      handleDatabaseError(error, "delete solution product");
      throw error;
    }
  }

  async searchByEmbedding(
    embedding: number[],
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<
    Array<
      SolutionProductResponse & { similarity_score: number; owner_info?: any }
    >
  > {
    try {
      const { data, error } = await supabase.rpc("match_solution_products", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        throw error;
      }

      return data.map((row: any) => ({
        ...this.formatResponse(row),
        similarity_score: row.similarity,
        owner_info: row.owner_info,
      }));
    } catch (error) {
      handleDatabaseError(error, "search solution products by embedding");
      throw error;
    }
  }

  async findWithOwnerInfo(
    embedding: number[],
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<
    Array<
      SolutionProductResponse & { similarity_score: number; owner_info: any }
    >
  > {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          solutions_owner!inner (
            company_name,
            domain,
            metadata as owner_metadata
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Para cada produto, calcula similaridade com o embedding fornecido
      const results = await Promise.all(
        data.map(async (row: any) => {
          const productEmbedding = row.embeddings;
          if (!productEmbedding) {
            return null;
          }

          const similarity = embeddingsService.calculateCosineSimilarity(
            embedding,
            productEmbedding
          );

          if (similarity < threshold) {
            return null;
          }

          return {
            ...this.formatResponse(row),
            similarity_score: similarity,
            owner_info: {
              company_name: row.solutions_owner.company_name,
              domain: row.solutions_owner.domain,
              metadata: row.solutions_owner.owner_metadata,
            },
          };
        })
      );

      return results
        .filter(Boolean)
        .sort((a, b) => b!.similarity_score - a!.similarity_score)
        .slice(0, limit) as Array<
        SolutionProductResponse & { similarity_score: number; owner_info: any }
      >;
    } catch (error) {
      handleDatabaseError(error, "find solution products with owner info");
      throw error;
    }
  }

  private formatResponse(row: SolutionProductRow): SolutionProductResponse {
    return {
      id: row.id,
      product_id: row.product_id,
      owner_id: row.owner_id,
      metadata: row.metadata,
      output_base_prompt: row.output_base_prompt,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const solutionProductRepository = new SolutionProductRepository();
export default solutionProductRepository;
