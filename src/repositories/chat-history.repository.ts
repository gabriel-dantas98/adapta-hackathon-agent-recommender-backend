import { supabase, handleDatabaseError } from "../config/database";
import { Database } from "../types/database";
import { ChatMessage, ChatHistoryResponse } from "../types/dtos";

type ChatHistoryRow = Database["public"]["Tables"]["users_chat_history"]["Row"];
type ChatHistoryInsert =
  Database["public"]["Tables"]["users_chat_history"]["Insert"];

export class ChatHistoryRepository {
  private tableName = "users_chat_history";

  async create(data: ChatMessage): Promise<ChatHistoryResponse> {
    const methodName = "create";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with data:`,
      JSON.stringify(data, null, 2)
    );

    try {
      const insertData: ChatHistoryInsert = {
        session_id: data.session_id,
        message: data.message,
        user_id: data.user_id,
      };

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Preparing to insert:`,
        JSON.stringify(insertData, null, 2)
      );

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select("*")
        .single();

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      const formattedResponse = this.formatResponse(result);
      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Successfully created with ID:`,
        result.id
      );
      return formattedResponse;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "create chat message");
      throw error;
    }
  }

  async findBySessionId(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryResponse[]> {
    const methodName = "findBySessionId";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with sessionId:${sessionId}, limit:${limit}, offset:${offset}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          data.length
        } messages for session ${sessionId}`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find chat history by session id");
      throw error;
    }
  }

  async findRecentBySessionId(
    sessionId: string,
    limit: number = 10
  ): Promise<ChatHistoryResponse[]> {
    const methodName = "findRecentBySessionId";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with sessionId:${sessionId}, limit:${limit}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: false })
        .limit(limit);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          data.length
        } recent messages for session ${sessionId}`
      );
      return data.reverse().map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find recent chat history by session id");
      throw error;
    }
  }

  async findAllBySessionId(sessionId: string): Promise<ChatHistoryResponse[]> {
    const methodName = "findAllBySessionId";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with sessionId:${sessionId}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: true });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          data.length
        } total messages for session ${sessionId}`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find all chat history by session id");
      throw error;
    }
  }

  async getMessageCount(sessionId: string): Promise<number> {
    const methodName = "getMessageCount";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with sessionId:${sessionId}`
    );

    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      const messageCount = count || 0;
      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Session ${sessionId} has ${messageCount} messages`
      );
      return messageCount;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "get message count");
      throw error;
    }
  }

  async findSessionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ session_id: string; message_count: number }[]> {
    const methodName = "findSessionsByDateRange";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with startDate:${startDate}, endDate:${endDate}`
    );

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("session_id")
        .gte("id", startDate)
        .lte("id", endDate);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          data.length
        } messages in date range`
      );

      // Agrupa por session_id e conta mensagens
      const sessionGroups = data.reduce((acc, row) => {
        acc[row.session_id] = (acc[row.session_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const result = Object.entries(sessionGroups).map(
        ([session_id, message_count]) => ({
          session_id,
          message_count,
        })
      );

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          result.length
        } unique sessions in date range`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find sessions by date range");
      throw error;
    }
  }

  async findSessionsByUserId(
    userId: string
  ): Promise<
    { session_id: string; message_count: number; last_activity: string }[]
  > {
    const methodName = "findSessionsByUserId";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with userId:${userId}`
    );

    try {
      // Busca todas as mensagens do usuário
      const { data, error } = await supabase
        .from(this.tableName)
        .select("session_id, id")
        .eq("user_id", userId)
        .order("id", { ascending: false });

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] No messages found for user ${userId}`
        );
        return [];
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          data.length
        } messages for user ${userId}`
      );

      // Agrupa por session_id, conta mensagens e pega última atividade
      const sessionGroups: Record<string, { count: number; lastId: number }> =
        {};

      data.forEach((row: any) => {
        const sessionId = row.session_id;
        const messageId = row.id;

        if (!sessionGroups[sessionId]) {
          sessionGroups[sessionId] = {
            count: 0,
            lastId: messageId,
          };
        }
        sessionGroups[sessionId].count += 1;

        // Como ordenamos por id desc, o primeiro id de cada sessão é o mais recente
        if (messageId > sessionGroups[sessionId].lastId) {
          sessionGroups[sessionId].lastId = messageId;
        }
      });

      const result = Object.entries(sessionGroups).map(
        ([session_id, { count, lastId }]) => ({
          session_id,
          message_count: count,
          last_activity: new Date(lastId).toISOString(),
        })
      );

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          result.length
        } unique sessions for user ${userId}`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "find sessions by user id");
      throw error;
    }
  }

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    const methodName = "deleteBySessionId";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with sessionId:${sessionId}`
    );

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("session_id", sessionId);

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Successfully deleted messages for session ${sessionId}`
      );
      return true;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "delete chat history by session id");
      throw error;
    }
  }

  async deleteOldMessages(daysOld: number): Promise<boolean> {
    const methodName = "deleteOldMessages";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with daysOld:${daysOld}`
    );

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Deleting messages older than ${cutoffDate.toISOString()}`
      );

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .lt("id", cutoffDate.toISOString());

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Successfully deleted old messages`
      );
      return true;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "delete old messages");
      throw error;
    }
  }

  /**
   * Busca mensagens por conteúdo (útil para análise)
   */
  async searchMessages(
    searchTerm: string,
    sessionId?: string,
    limit: number = 20
  ): Promise<ChatHistoryResponse[]> {
    const methodName = "searchMessages";
    console.log(
      `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Starting with searchTerm:${searchTerm}, sessionId:${sessionId}, limit:${limit}`
    );

    try {
      let query = supabase
        .from(this.tableName)
        .select("*")
        .textSearch("message", searchTerm)
        .limit(limit);

      if (sessionId) {
        query = query.eq("session_id", sessionId);
        console.log(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Filtering by session ${sessionId}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Database error:`,
          error
        );
        throw error;
      }

      console.log(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Found ${
          data.length
        } messages matching search term`
      );
      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatHistoryRepository.${methodName}] Error occurred:`,
        error
      );
      handleDatabaseError(error, "search messages");
      throw error;
    }
  }

  private formatResponse(row: ChatHistoryRow): ChatHistoryResponse {
    return {
      id: row.id,
      session_id: row.session_id,
      message: row.message,
      user_id: row.user_id,
    };
  }
}

export const chatHistoryRepository = new ChatHistoryRepository();
export default chatHistoryRepository;
