import { supabase, handleDatabaseError } from "../config/database";
import { Database } from "../types/database";
import {
  OnboardingInput,
  UpdateUserContextInput,
  UserEnhancedContextResponse,
} from "../types/dtos";
import { embeddingsService } from "../services/embeddings.service";

type UserEnhancedContextRow =
  Database["public"]["Tables"]["users_enhanced_context"]["Row"];
type UserEnhancedContextInsert =
  Database["public"]["Tables"]["users_enhanced_context"]["Insert"];
type UserEnhancedContextUpdate =
  Database["public"]["Tables"]["users_enhanced_context"]["Update"];

export class UserEnhancedContextRepository {
  private tableName = "users_enhanced_context";

  async create(data: OnboardingInput): Promise<UserEnhancedContextResponse> {
    try {
      // Gera embeddings para o contexto do usuário
      const embeddings =
        await embeddingsService.generateEmbeddingFromUserContext(
          data.metadata,
          data.output_base_prompt
        );

      const insertData: UserEnhancedContextInsert = {
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
      handleDatabaseError(error, "create user enhanced context");
      throw error;
    }
  }

  async findById(id: string): Promise<UserEnhancedContextResponse | null> {
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
      handleDatabaseError(error, "find user enhanced context by id");
      throw error;
    }
  }

  async findByUserId(
    userId: string
  ): Promise<UserEnhancedContextResponse | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return this.formatResponse(data);
    } catch (error) {
      handleDatabaseError(error, "find user enhanced context by user id");
      throw error;
    }
  }

  async findByContextId(
    contextId: string
  ): Promise<UserEnhancedContextResponse | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("context_id", contextId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return this.formatResponse(data);
    } catch (error) {
      handleDatabaseError(error, "find user enhanced context by context id");
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateUserContextInput
  ): Promise<UserEnhancedContextResponse | null> {
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

        embeddings = await embeddingsService.generateEmbeddingFromUserContext(
          updatedMetadata,
          updatedPrompt
        );
      }

      const updateData: UserEnhancedContextUpdate = {
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
      handleDatabaseError(error, "update user enhanced context");
      throw error;
    }
  }

  async updateWithThreadSummary(
    userId: string,
    threadSummary: string,
    metadata?: Record<string, any>
  ): Promise<UserEnhancedContextResponse | null> {
    try {
      const current = await this.findByUserId(userId);
      if (!current) {
        return null;
      }

      const updatedMetadata = metadata || current.metadata;

      // Gera embeddings considerando o resumo da thread
      const embeddings = await embeddingsService.generateUserContextEmbedding(
        updatedMetadata,
        current.output_base_prompt,
        threadSummary
      );

      const updateData: UserEnhancedContextUpdate = {
        metadata: updatedMetadata,
        embeddings,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return this.formatResponse(result);
    } catch (error) {
      handleDatabaseError(
        error,
        "update user enhanced context with thread summary"
      );
      throw error;
    }
  }

  async delete(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      handleDatabaseError(error, "delete user enhanced context");
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<UserEnhancedContextResponse[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "find all user enhanced contexts");
      throw error;
    }
  }

  async searchByEmbedding(
    embedding: number[],
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<
    Array<UserEnhancedContextResponse & { similarity_score: number }>
  > {
    try {
      const { data, error } = await supabase.rpc("match_user_contexts", {
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
      handleDatabaseError(error, "search user enhanced contexts by embedding");
      throw error;
    }
  }

  /**
   * Busca contextos similares para análise de padrões
   */
  async findSimilarContexts(
    userId: string,
    threshold: number = 0.8,
    limit: number = 5
  ): Promise<
    Array<UserEnhancedContextResponse & { similarity_score: number }>
  > {
    try {
      const userContext = await this.findByUserId(userId);
      if (!userContext || !userContext.embeddings) {
        return [];
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .neq("user_id", userId);

      if (error) {
        throw error;
      }

      const results = await Promise.all(
        data.map(async (row: any) => {
          const contextEmbedding = row.embeddings;
          if (!contextEmbedding) {
            return null;
          }

          const similarity = embeddingsService.calculateCosineSimilarity(
            userContext.embeddings!,
            contextEmbedding
          );

          if (similarity < threshold) {
            return null;
          }

          return {
            ...this.formatResponse(row),
            similarity_score: similarity,
          };
        })
      );

      return results
        .filter(Boolean)
        .sort((a, b) => b!.similarity_score - a!.similarity_score)
        .slice(0, limit) as Array<
        UserEnhancedContextResponse & { similarity_score: number }
      >;
    } catch (error) {
      handleDatabaseError(error, "find similar user contexts");
      throw error;
    }
  }

  private formatResponse(
    row: UserEnhancedContextRow
  ): UserEnhancedContextResponse {
    return {
      id: row.id,
      context_id: row.context_id,
      user_id: row.user_id,
      metadata: row.metadata,
      output_base_prompt: row.output_base_prompt,
      embeddings: row.embeddings,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const userEnhancedContextRepository =
  new UserEnhancedContextRepository();
export default userEnhancedContextRepository;
