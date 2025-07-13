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
    try {
      // Gera embeddings para o owner
      const embeddings = await embeddingsService.generateEmbeddingFromMetadata(
        data.metadata,
        data.output_base_prompt
      );

      const insertData: SolutionOwnerInsert = {
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
      handleDatabaseError(error, "create solution owner");
      throw error;
    }
  }

  async findById(id: string): Promise<SolutionOwnerResponse | null> {
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
      handleDatabaseError(error, "find solution owner by id");
      throw error;
    }
  }

  async findByCompanyId(
    companyId: string
  ): Promise<SolutionOwnerResponse | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return this.formatResponse(data);
    } catch (error) {
      handleDatabaseError(error, "find solution owner by company id");
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<SolutionOwnerResponse[]> {
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
      handleDatabaseError(error, "find all solution owners");
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateSolutionOwnerInput
  ): Promise<SolutionOwnerResponse | null> {
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

      const updateData: SolutionOwnerUpdate = {
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
      handleDatabaseError(error, "update solution owner");
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
      handleDatabaseError(error, "delete solution owner");
      throw error;
    }
  }

  async searchByEmbedding(
    embedding: number[],
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<Array<SolutionOwnerResponse & { similarity_score: number }>> {
    try {
      const { data, error } = await supabase.rpc("match_solution_owners", {
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
      }));
    } catch (error) {
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
