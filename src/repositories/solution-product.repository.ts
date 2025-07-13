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
    const methodName = "create";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with data:`,
      JSON.stringify(data, null, 2)
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Generating embeddings for product metadata`
      );

      // Gera embeddings para o produto
      const embeddings = await embeddingsService.generateEmbeddingFromMetadata(
        data.metadata,
        data.title,
        data.description,
        data.categories
      );

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Embeddings generated successfully, dimension: ${
          embeddings.length
        }`
      );

      const insertData: SolutionProductInsert = {
        ...data,
        embeddings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Preparing to insert:`,
        JSON.stringify(
          { ...insertData, embeddings: `[${embeddings.length} dimensions]` },
          null,
          2
        )
      );

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select("*")
        .single();

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database result:`,
        result
      );

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      const formattedResponse = this.formatResponse(result);
      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Successfully created solution product with ID:`,
        result.id
      );
      return formattedResponse;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "create solution product");
      throw error;
    }
  }

  async findById(id: string): Promise<SolutionProductResponse | null> {
    const methodName = "findById";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with id:${id}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Solution product not found with id:${id}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Found solution product:`,
        data.title
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find solution product by id");
      throw error;
    }
  }

  async findByProductId(
    productId: string
  ): Promise<SolutionProductResponse | null> {
    const methodName = "findByProductId";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with productId:${productId}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("product_id", productId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Solution product not found with productId:${productId}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Found solution product:`,
        data.title
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find solution product by product id");
      throw error;
    }
  }

  async findByOwnerId(
    ownerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SolutionProductResponse[]> {
    const methodName = "findByOwnerId";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with ownerId:${ownerId}, limit:${limit}, offset:${offset}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Found ${
          data.length
        } solution products for owner ${ownerId}`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find solution products by owner id");
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<SolutionProductResponse[]> {
    const methodName = "findAll";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with limit:${limit}, offset:${offset}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Found ${
          data.length
        } solution products`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find all solution products");
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateSolutionProductInput
  ): Promise<SolutionProductResponse | null> {
    const methodName = "update";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with id:${id}, data:`,
      JSON.stringify(data, null, 2)
    );

    try {
      let embeddings: number[] | undefined;

      // Regenera embeddings se metadata ou output_base_prompt foram alterados
      if (data.metadata || data.output_base_prompt) {
        console.log(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Regenerating embeddings due to metadata/prompt changes`
        );

        const current = await this.findById(id);
        if (!current) {
          console.log(
            `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Solution product not found for update with id:${id}`
          );
          return null;
        }

        const updatedMetadata = data.metadata || current.metadata;

        embeddings = await embeddingsService.generateEmbeddingFromMetadata(
          updatedMetadata,
          current.title,
          current.description,
          current.categories
        );

        console.log(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] New embeddings generated, dimension: ${
            embeddings.length
          }`
        );
      }

      const updateData: SolutionProductUpdate = {
        ...data,
        ...(embeddings && { embeddings }),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Preparing to update:`,
        JSON.stringify(
          {
            ...updateData,
            embeddings: embeddings
              ? `[${embeddings.length} dimensions]`
              : undefined,
          },
          null,
          2
        )
      );

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Solution product not found for update with id:${id}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Successfully updated solution product with ID:`,
        result.id
      );
      return this.formatResponse(result);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "update solution product");
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const methodName = "delete";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with id:${id}`
    );

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Successfully deleted solution product with ID:${id}`
      );
      return true;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
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
    const methodName = "searchByEmbedding";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with embedding dimension:${
        embedding.length
      }, threshold:${threshold}, limit:${limit}`
    );

    try {
      const { data, error } = await supabase.rpc("match_solution_products", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Found ${
          data.length
        } solution products matching embedding criteria`
      );
      return data.map((row: any) => ({
        ...this.formatResponse(row),
        similarity_score: row.similarity,
        owner_info: row.owner_info,
      }));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "search solution products by embedding");
      throw error;
    }
  }

  async findWithOwnerInfo(
    userEmbedding: number[],
    threadEmbedding: number[],
    userWeight: number = 0.75,
    threadWeight: number = 0.25,
    limit: number = 10
  ): Promise<
    Array<
      SolutionProductResponse & { similarity_score: number; owner_info: any }
    >
  > {
    const methodName = "findWithOwnerInfo";
    console.log(
      `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Starting with userEmbedding:${
        userEmbedding.length
      }d, threadEmbedding:${
        threadEmbedding.length
      }d, userWeight:${userWeight}, threadWeight:${threadWeight}, limit:${limit}`
    );

    try {
      const { data, error } = await supabase.rpc("match_products_full", {
        _user_embedding: userEmbedding,
        _thread_embedding: threadEmbedding,
        _k: limit,
      });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Found ${
          data.length
        } solution products with owner info`
      );
      return data.map((row: any) => ({
        ...this.formatResponse(row),
        similarity_score: row.similarity,
        owner_info: row.owner_info,
      }));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionProductRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find solution products with owner info");
      throw error;
    }
  }

  private formatResponse(row: SolutionProductRow): SolutionProductResponse {
    return {
      id: row.id,
      product_id: row.product_id,
      owner_id: row.owner_id,
      title: row.title,
      description: row.description,
      image_url: row.image_url,
      url: row.url,
      categories: row.categories,
      metadata: row.metadata,
      output_base_prompt: row.output_base_prompt,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const solutionProductRepository = new SolutionProductRepository();
export default solutionProductRepository;
