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
  private tableName = "users_enhanced_context" as const;

  async create(data: OnboardingInput): Promise<UserEnhancedContextResponse> {
    const methodName = "create";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with data:`,
      JSON.stringify(data, null, 2)
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Generating embeddings for user context`
      );

      // Gera embeddings para o contexto do usuário
      const embeddings =
        await embeddingsService.generateEmbeddingFromUserContext(
          data.metadata,
          data.output_base_prompt
        );

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Embeddings generated successfully, dimension: ${
          embeddings.length
        }`
      );

      const insertData: UserEnhancedContextInsert = {
        user_id: data.user_id,
        metadata: data.metadata,
        output_base_prompt: data.output_base_prompt,
        embeddings: JSON.stringify(embeddings),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Preparing to insert:`,
        JSON.stringify(
          { ...insertData, embeddings: `[${embeddings.length} dimensions]` },
          null,
          2
        )
      );

      const { data: result, error } = await supabase
        .from("users_enhanced_context")
        .insert(insertData)
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      const formattedResponse = this.formatResponse(result);
      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully created user enhanced context with ID:`,
        result.id
      );
      return formattedResponse;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "create user enhanced context");
      throw error;
    }
  }

  async upsert(data: OnboardingInput): Promise<UserEnhancedContextResponse> {
    const methodName = "upsert";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with data:`,
      JSON.stringify(data, null, 2)
    );

    try {
      // Verifica se já existe um contexto para o usuário
      const existingContext = await this.findByUserId(data.user_id);

      if (existingContext) {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found existing context for user:${
            data.user_id
          }, updating...`
        );

        // Atualiza o contexto existente
        const updatedContext = await this.update(existingContext.id, {
          metadata: data.metadata,
          output_base_prompt: data.output_base_prompt,
        });

        if (!updatedContext) {
          throw new Error("Failed to update existing context");
        }

        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully updated existing context for user:${
            data.user_id
          }`
        );
        return updatedContext;
      } else {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] No existing context found for user:${
            data.user_id
          }, creating new...`
        );

        // Cria um novo contexto
        const newContext = await this.create(data);
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully created new context for user:${
            data.user_id
          }`
        );
        return newContext;
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "upsert user enhanced context");
      throw error;
    }
  }

  async findById(id: string): Promise<UserEnhancedContextResponse | null> {
    const methodName = "findById";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with id:${id}`
    );

    try {
      const { data, error } = await supabase
        .from("users_enhanced_context")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User enhanced context not found with id:${id}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found user enhanced context for user:`,
        data.user_id
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find user enhanced context by id");
      throw error;
    }
  }

  async findByUserId(
    userId: string
  ): Promise<UserEnhancedContextResponse | null> {
    const methodName = "findByUserId";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with userId:${userId}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User enhanced context not found with userId:${userId}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found user enhanced context for user:`,
        data.user_id
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find user enhanced context by user id");
      throw error;
    }
  }

  async findByContextId(
    contextId: string
  ): Promise<UserEnhancedContextResponse | null> {
    const methodName = "findByContextId";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with contextId:${contextId}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("context_id", contextId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User enhanced context not found with contextId:${contextId}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found user enhanced context for user:`,
        data.user_id
      );
      return this.formatResponse(data);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find user enhanced context by context id");
      throw error;
    }
  }

  async update(
    data: UpdateUserContextInput,
    id?: string
  ): Promise<UserEnhancedContextResponse | null> {
    const methodName = "update";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with id:${id}, data:`,
      JSON.stringify(data, null, 2)
    );

    try {
      let embeddings: number[] | undefined;

      // Regenera embeddings se metadata ou output_base_prompt foram alterados
      if (data.metadata || data.output_base_prompt) {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Regenerating embeddings due to metadata/prompt changes`
        );

        const current = await this.findById(id);
        if (!current) {
          console.log(
            `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User enhanced context not found for update with id:${id}`
          );
          return null;
        }

        const updatedMetadata = data.metadata || current.metadata;
        const updatedPrompt =
          data.output_base_prompt || current.output_base_prompt;

        embeddings = await embeddingsService.generateEmbeddingFromUserContext(
          updatedMetadata,
          updatedPrompt
        );

        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] New embeddings generated, dimension: ${
            embeddings.length
          }`
        );
      }

      const updateData: UserEnhancedContextUpdate = {
        ...data,
        ...(embeddings && { embeddings: JSON.stringify(embeddings) }),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Preparing to update:`,
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
            `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User enhanced context not found for update with id:${id}`
          );
          return null;
        }
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully updated user enhanced context with ID:`,
        result.id
      );
      return this.formatResponse(result);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "update user enhanced context");
      throw error;
    }
  }

  async updateWithThreadSummary(
    userId: string,
    threadSummary: string,
    metadata?: Record<string, any>
  ): Promise<UserEnhancedContextResponse | null> {
    const methodName = "updateWithThreadSummary";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with userId:${userId}, threadSummary length:${
        threadSummary.length
      }, metadata:`,
      metadata ? JSON.stringify(metadata, null, 2) : "none"
    );

    let response: UserEnhancedContextResponse | null = null;
    let error: any;

    try {
      const current = await this.findByUserId(userId);
      if (!current) {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User enhanced context not found for user:${userId}`
        );
      }

      const updatedMetadata = metadata || current?.metadata || {};

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Generating embeddings with thread summary`
      );

      // Gera embeddings considerando o resumo da thread
      const { embedding, summary } =
        await embeddingsService.generateUserContextEmbedding(
          updatedMetadata,
          current?.output_base_prompt || {},
          threadSummary
        );

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Generated successfully user context summary: ${summary} with dimension: ${
          embedding.length
        }`
      );

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Embeddings generated successfully, dimension: ${
          embedding.length
        }`
      );

      if (current) {
        const updateData: UserEnhancedContextUpdate = {
          ...current,
          embeddings: JSON.stringify(embedding),
          output_base_prompt: summary || {},
          updated_at: new Date().toISOString(),
        };
        const { data: result, error } = await supabase
          .from(this.tableName)
          .update(updateData)
          .eq("id", current.id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        response = this.formatResponse(result);
      } else {
        const insertData: UserEnhancedContextInsert = {
          user_id: userId,
          metadata: {},
          embeddings: JSON.stringify(embedding),
          output_base_prompt: summary || {},
        };

        const { data: result, error } = await supabase
          .from(this.tableName)
          .insert(insertData)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        response = this.formatResponse(result);
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully updated user enhanced context with thread summary`
      );

      return response;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(
        error,
        "update user enhanced context with thread summary"
      );
      throw error;
    }
  }

  async upsertWithThreadSummary(
    userId: string,
    threadSummary: string,
    metadata?: Record<string, any>
  ): Promise<UserEnhancedContextResponse> {
    const methodName = "upsertWithThreadSummary";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with userId:${userId}, threadSummary length:${
        threadSummary.length
      }, metadata:`,
      metadata ? JSON.stringify(metadata, null, 2) : "none"
    );

    try {
      const current = await this.findByUserId(userId);

      if (current) {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found existing context for user:${userId}, updating with thread summary...`
        );

        const updatedContext = await this.updateWithThreadSummary(
          userId,
          threadSummary,
          metadata
        );

        if (!updatedContext) {
          throw new Error(
            "Failed to update existing context with thread summary"
          );
        }

        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully updated existing context with thread summary for user:${userId}`
        );
        return updatedContext;
      } else {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] No existing context found for user:${userId}, creating new with thread summary...`
        );

        // Se não existe, cria um novo contexto básico com os dados do resumo da thread
        const newContext = await this.create({
          user_id: userId,
          metadata: metadata || {},
          output_base_prompt: {},
        });

        // Depois atualiza com o resumo da thread
        const updatedContext = await this.updateWithThreadSummary(
          userId,
          threadSummary,
          metadata
        );

        if (!updatedContext) {
          throw new Error("Failed to update new context with thread summary");
        }

        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully created and updated new context with thread summary for user:${userId}`
        );
        return updatedContext;
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(
        error,
        "upsert user enhanced context with thread summary"
      );
      throw error;
    }
  }

  async delete(userId: string): Promise<boolean> {
    const methodName = "delete";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with userId:${userId}`
    );

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Successfully deleted user enhanced context for user:${userId}`
      );
      return true;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "delete user enhanced context");
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<UserEnhancedContextResponse[]> {
    const methodName = "findAll";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with limit:${limit}, offset:${offset}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found ${
          data.length
        } user enhanced contexts`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
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
    const methodName = "searchByEmbedding";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with embedding dimension:${
        embedding.length
      }, threshold:${threshold}, limit:${limit}`
    );

    try {
      const { data, error } = await supabase.rpc("match_user_contexts", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found ${
          data.length
        } user contexts matching embedding criteria`
      );
      return data.map((row: any) => ({
        ...this.formatResponse(row),
        similarity_score: row.similarity,
      }));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "search user contexts by embedding");
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
    const methodName = "findSimilarContexts";
    console.log(
      `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Starting with userId:${userId}, threshold:${threshold}, limit:${limit}`
    );

    try {
      const current = await this.findByUserId(userId);
      if (!current || !current.embeddings) {
        console.log(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] User context not found or no embeddings for user:${userId}`
        );
        return [];
      }

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found current user context, searching for similar contexts`
      );

      const { data, error } = await supabase.rpc("match_user_contexts", {
        query_embedding: current.embeddings,
        match_threshold: threshold,
        match_count: limit + 1, // +1 para excluir o próprio contexto
      });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      // Exclui o próprio contexto dos resultados
      const filteredResults = data
        .filter((row: any) => row.user_id !== userId)
        .slice(0, limit);

      console.log(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Found ${
          filteredResults.length
        } similar user contexts`
      );
      return filteredResults.map((row: any) => ({
        ...this.formatResponse(row),
        similarity_score: row.similarity,
      }));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [UserEnhancedContextRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find similar user contexts");
      throw error;
    }
  }

  private formatResponse(
    row: UserEnhancedContextRow
  ): UserEnhancedContextResponse {
    return {
      id: row.id,
      user_id: row.user_id,
      context_id: row.context_id,
      metadata: row.metadata as Record<string, any>,
      output_base_prompt: row.output_base_prompt as Record<string, any>,
      embeddings: row.embeddings ? JSON.parse(row.embeddings) : null,
      created_at: row.created_at || "",
      updated_at: row.updated_at || "",
    };
  }
}

export const userEnhancedContextRepository =
  new UserEnhancedContextRepository();
export default userEnhancedContextRepository;
