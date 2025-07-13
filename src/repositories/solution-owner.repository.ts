import { supabase, handleDatabaseError } from "../config/database";
import { Database } from "../types/database";
import {
  CreateSolutionOwnerInput,
  UpdateSolutionOwnerInput,
  SolutionOwnerResponse,
} from "../types/dtos";
import { embeddingsService } from "../services/embeddings.service";

type SolutionOwnerRow = Database["public"]["Tables"]["solutions_owner"]["Row"];
type SolutionOwnerInsert =
  Database["public"]["Tables"]["solutions_owner"]["Insert"];
type SolutionOwnerUpdate =
  Database["public"]["Tables"]["solutions_owner"]["Update"];

export class SolutionOwnerRepository {
  private tableName = "solutions_owner";

  async create(data: CreateSolutionOwnerInput): Promise<SolutionOwnerResponse> {
    const methodName = "create";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with data:`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Generating embeddings for owner metadata`
      );

      // Gera embeddings para o owner
      const embeddings =
        await embeddingsService.generateEmbeddingFromOwnerMetadata(
          data.metadata,
          {
            company_title: data.company_title,
            company_description: data.company_description || "",
          }
        );

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Embeddings generated successfully, dimension: ${
          embeddings.length
        }`
      );

      const insertData: SolutionOwnerInsert = {
        company_name: data.company_title,
        domain: data.url || null,
        metadata: data.metadata,
        output_base_prompt: {
          company_title: data.company_title,
          company_description: data.company_description || "",
        },
        embeddings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Preparing to insert:`
      );

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      const formattedResponse = this.formatResponse(result);
      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Successfully created solution owner with ID:`,
        result.id
      );
      return formattedResponse;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "create solution owner");
      throw error;
    }
  }

  async findById(id: string): Promise<SolutionOwnerResponse | null> {
    const methodName = "findById";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with id:${id}`
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
            `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Solution owner not found with id:${id}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Found solution owner:`,
        data.company_name
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find solution owner by id");
      throw error;
    }
  }

  async findByCompanyId(
    companyId: string
  ): Promise<SolutionOwnerResponse | null> {
    const methodName = "findByCompanyId";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with companyId:${companyId}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Solution owner not found with companyId:${companyId}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Found solution owner:`,
        data.company_name
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find solution owner by company id");
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<SolutionOwnerResponse[]> {
    const methodName = "findAll";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with limit:${limit}, offset:${offset}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Found ${
          data.length
        } solution owners`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find all solution owners");
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateSolutionOwnerInput
  ): Promise<SolutionOwnerResponse | null> {
    const methodName = "update";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with id:${id}, data:`
    );

    try {
      let embeddings: number[] | undefined;

      // Regenera embeddings se metadata foram alterados
      if (data.metadata || data.company_title) {
        console.log(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Regenerating embeddings due to metadata/title changes`
        );

        const current = await this.findById(id);
        if (!current) {
          console.log(
            `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Solution owner not found for update with id:${id}`
          );
          return null;
        }

        const updatedMetadata = data.metadata || current.metadata;
        const updatedPrompt = {
          company_title: data.company_title || current.company_name,
          company_description: data.company_description || "",
        };

        embeddings = await embeddingsService.generateEmbeddingFromOwnerMetadata(
          updatedMetadata,
          updatedPrompt
        );

        console.log(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] New embeddings generated, dimension: ${
            embeddings.length
          }`
        );
      }

      const updateData: SolutionOwnerUpdate = {
        ...(data.company_title && { company_name: data.company_title }),
        ...(data.url !== undefined && { domain: data.url }),
        ...(data.metadata && { metadata: data.metadata }),
        ...(data.company_title && {
          output_base_prompt: {
            company_title: data.company_title,
            company_description: data.company_description || "",
          },
        }),
        ...(embeddings && { embeddings }),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Preparing to update:`,
        JSON.stringify(
          {
            ...updateData,
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
            `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Solution owner not found for update with id:${id}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Successfully updated solution owner with ID:`,
        result.id
      );
      return this.formatResponse(result);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "update solution owner");
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const methodName = "delete";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with id:${id}`
    );

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Successfully deleted solution owner with ID:${id}`
      );
      return true;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "delete solution owner");
      throw error;
    }
  }

  async searchByEmbedding(
    embedding: number[],
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<Array<SolutionOwnerResponse & { similarity_score: number }>> {
    const methodName = "searchByEmbedding";
    console.log(
      `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Starting with embedding dimension:${
        embedding.length
      }, threshold:${threshold}, limit:${limit}`
    );

    try {
      const { data, error } = await supabase.rpc("match_solution_owners", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Found ${
          data.length
        } solution owners matching embedding criteria`
      );
      return data.map((row: any) => ({
        ...this.formatResponse(row),
        similarity_score: row.similarity,
      }));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SolutionOwnerRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "search solution owners by embedding");
      throw error;
    }
  }

  private formatResponse(row: SolutionOwnerRow): SolutionOwnerResponse {
    return {
      id: row.id,
      company_id: row.company_id,
      company_name: row.company_name,
      domain: row.domain,
      metadata: row.metadata,
      output_base_prompt: row.output_base_prompt,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const solutionOwnerRepository = new SolutionOwnerRepository();
export default solutionOwnerRepository;
