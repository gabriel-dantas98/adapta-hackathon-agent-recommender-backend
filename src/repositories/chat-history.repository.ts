import { supabase, handleDatabaseError } from "../config/database";
import { Database } from "../types/database";
import { ChatMessage, ChatHistoryResponse } from "../types/dtos";

type ChatHistoryRow = Database["public"]["Tables"]["users_chat_history"]["Row"];
type ChatHistoryInsert =
  Database["public"]["Tables"]["users_chat_history"]["Insert"];

export class ChatHistoryRepository {
  private tableName = "users_chat_history";

  async create(data: ChatMessage): Promise<ChatHistoryResponse> {
    try {
      const insertData: ChatHistoryInsert = {
        session_id: data.session_id,
        message: data.message,
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
      handleDatabaseError(error, "create chat message");
      throw error;
    }
  }

  async findBySessionId(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryResponse[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "find chat history by session id");
      throw error;
    }
  }

  async findRecentBySessionId(
    sessionId: string,
    limit: number = 10
  ): Promise<ChatHistoryResponse[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.reverse().map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "find recent chat history by session id");
      throw error;
    }
  }

  async findAllBySessionId(sessionId: string): Promise<ChatHistoryResponse[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "find all chat history by session id");
      throw error;
    }
  }

  async getMessageCount(sessionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      handleDatabaseError(error, "get message count");
      throw error;
    }
  }

  async findSessionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ session_id: string; message_count: number }[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("session_id")
        .gte("id", startDate)
        .lte("id", endDate);

      if (error) {
        throw error;
      }

      // Agrupa por session_id e conta mensagens
      const sessionGroups = data.reduce((acc, row) => {
        acc[row.session_id] = (acc[row.session_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(sessionGroups).map(
        ([session_id, message_count]) => ({
          session_id,
          message_count,
        })
      );
    } catch (error) {
      handleDatabaseError(error, "find sessions by date range");
      throw error;
    }
  }

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("session_id", sessionId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      handleDatabaseError(error, "delete chat history by session id");
      throw error;
    }
  }

  async deleteOldMessages(daysOld: number): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .lt("id", cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
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
    try {
      let query = supabase
        .from(this.tableName)
        .select("*")
        .ilike("message", `%${searchTerm}%`)
        .order("id", { ascending: false })
        .limit(limit);

      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map((row) => this.formatResponse(row));
    } catch (error) {
      handleDatabaseError(error, "search messages");
      throw error;
    }
  }

  private formatResponse(row: ChatHistoryRow): ChatHistoryResponse {
    return {
      id: row.id,
      session_id: row.session_id,
      message: row.message,
    };
  }
}

export const chatHistoryRepository = new ChatHistoryRepository();
export default chatHistoryRepository;
