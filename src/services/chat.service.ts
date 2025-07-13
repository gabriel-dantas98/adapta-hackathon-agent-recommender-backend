import { embeddingsService } from "./embeddings.service";
import { summaryService } from "./summary.service";
import { chatHistoryRepository } from "../repositories/chat-history.repository";
import { userEnhancedContextRepository } from "../repositories/user-enhanced-context.repository";
import { ChatMessage } from "../types/dtos";

class ChatService {
  /**
   * Processa uma nova mensagem no chat
   */
  async processMessage(
    sessionId: string,
    message: Record<string, any>,
    userId?: string
  ): Promise<{
    messageId: number;
    threadSummary: string;
    userContextUpdated: boolean;
  }> {
    try {
      // 1. Salvar mensagem no histórico
      const chatMessage: ChatMessage = {
        session_id: sessionId,
        message: message,
      };

      const savedMessage = await chatHistoryRepository.create(chatMessage);

      // 2. Buscar histórico completo da thread
      const allMessages = await chatHistoryRepository.findAllBySessionId(
        sessionId
      );

      // 3. Gerar resumo da thread
      const chatMessages = allMessages.map((msg) => ({
        role: msg.message.role || "user",
        content: msg.message.content || JSON.stringify(msg.message),
        timestamp: msg.id.toString(),
      }));

      const threadSummary = await summaryService.generateThreadSummary(
        chatMessages
      );

      // 4. Gerar embedding da thread
      const threadEmbedding = await embeddingsService.generateThreadEmbedding(
        chatMessages,
        threadSummary
      );

      // 5. Atualizar contexto do usuário (se fornecido)
      let userContextUpdated = false;
      if (userId) {
        try {
          const updatedContext =
            await userEnhancedContextRepository.updateWithThreadSummary(
              userId,
              threadSummary
            );
          userContextUpdated = !!updatedContext;
        } catch (error) {
          console.warn("Failed to update user context:", error);
        }
      }

      return {
        messageId: savedMessage.id,
        threadSummary,
        userContextUpdated,
      };
    } catch (error) {
      console.error("Error processing message:", error);
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  /**
   * Busca histórico de uma thread com resumo
   */
  async getThreadHistory(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    messages: Array<{
      id: number;
      message: Record<string, any>;
      timestamp: string;
    }>;
    total: number;
    summary?: string;
  }> {
    try {
      const messages = await chatHistoryRepository.findBySessionId(
        sessionId,
        limit,
        offset
      );
      const total = await chatHistoryRepository.getMessageCount(sessionId);

      // Gerar resumo se houver mensagens
      let summary: string | undefined;
      if (messages.length > 0) {
        const chatMessages = messages.map((msg) => ({
          role: msg.message.role || "user",
          content: msg.message.content || JSON.stringify(msg.message),
        }));

        summary = await summaryService.generateThreadSummary(chatMessages);
      }

      return {
        messages: messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          timestamp: msg.id.toString(),
        })),
        total,
        summary,
      };
    } catch (error) {
      console.error("Error getting thread history:", error);
      throw new Error(`Failed to get thread history: ${error.message}`);
    }
  }

  /**
   * Busca threads de um usuário
   */
  async getUserThreads(
    userId: string,
    daysBack: number = 30
  ): Promise<
    Array<{
      session_id: string;
      message_count: number;
      last_activity: string;
      summary?: string;
    }>
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const endDate = new Date();

      const sessions = await chatHistoryRepository.findSessionsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Para cada sessão, buscar última atividade e gerar resumo
      const threadsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          const recentMessages =
            await chatHistoryRepository.findRecentBySessionId(
              session.session_id,
              5
            );

          let summary: string | undefined;
          if (recentMessages.length > 0) {
            const chatMessages = recentMessages.map((msg) => ({
              role: msg.message.role || "user",
              content: msg.message.content || JSON.stringify(msg.message),
            }));

            summary = await summaryService.generateThreadSummary(chatMessages);
          }

          return {
            session_id: session.session_id,
            message_count: session.message_count,
            last_activity:
              recentMessages[recentMessages.length - 1]?.id.toString() || "",
            summary,
          };
        })
      );

      return threadsWithDetails;
    } catch (error) {
      console.error("Error getting user threads:", error);
      throw new Error(`Failed to get user threads: ${error.message}`);
    }
  }

  /**
   * Busca mensagens por conteúdo
   */
  async searchMessages(
    query: string,
    sessionId?: string,
    limit: number = 20
  ): Promise<
    Array<{
      id: number;
      session_id: string;
      message: Record<string, any>;
      relevance_score: number;
    }>
  > {
    try {
      // Buscar mensagens por texto
      const messages = await chatHistoryRepository.searchMessages(
        query,
        sessionId,
        limit
      );

      // Gerar embedding para a query
      const queryEmbedding = await embeddingsService.generateEmbedding(query);

      // Calcular relevância de cada mensagem
      const messagesWithRelevance = await Promise.all(
        messages.map(async (message) => {
          const messageText =
            message.message.content || JSON.stringify(message.message);
          const messageEmbedding = await embeddingsService.generateEmbedding(
            messageText
          );

          const relevanceScore = embeddingsService.calculateCosineSimilarity(
            queryEmbedding,
            messageEmbedding
          );

          return {
            id: message.id,
            session_id: message.session_id,
            message: message.message,
            relevance_score: relevanceScore,
          };
        })
      );

      // Ordenar por relevância
      return messagesWithRelevance.sort(
        (a, b) => b.relevance_score - a.relevance_score
      );
    } catch (error) {
      console.error("Error searching messages:", error);
      throw new Error(`Failed to search messages: ${error.message}`);
    }
  }

  /**
   * Analisa padrões de conversa de um usuário
   */
  async analyzeConversationPatterns(
    userId: string,
    daysBack: number = 30
  ): Promise<{
    total_messages: number;
    active_sessions: number;
    avg_messages_per_session: number;
    common_topics: Array<{ topic: string; frequency: number }>;
  }> {
    try {
      const threads = await this.getUserThreads(userId, daysBack);

      const totalMessages = threads.reduce(
        (sum, thread) => sum + thread.message_count,
        0
      );
      const activeSessions = threads.length;
      const avgMessagesPerSession =
        activeSessions > 0 ? totalMessages / activeSessions : 0;

      // Análise básica de tópicos comuns (pode ser expandida)
      const topicFrequency = new Map<string, number>();

      // Extrair tópicos dos resumos
      threads.forEach((thread) => {
        if (thread.summary) {
          const words = thread.summary.toLowerCase().split(/\s+/);
          words.forEach((word) => {
            if (word.length > 3) {
              // Filtrar palavras muito pequenas
              topicFrequency.set(word, (topicFrequency.get(word) || 0) + 1);
            }
          });
        }
      });

      const commonTopics = Array.from(topicFrequency.entries())
        .map(([topic, frequency]) => ({ topic, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      return {
        total_messages: totalMessages,
        active_sessions: activeSessions,
        avg_messages_per_session: avgMessagesPerSession,
        common_topics: commonTopics,
      };
    } catch (error) {
      console.error("Error analyzing conversation patterns:", error);
      throw new Error(
        `Failed to analyze conversation patterns: ${error.message}`
      );
    }
  }

  /**
   * Limpa histórico antigo
   */
  async cleanupOldMessages(daysOld: number = 90): Promise<number> {
    try {
      const result = await chatHistoryRepository.deleteOldMessages(daysOld);
      return result ? 1 : 0;
    } catch (error) {
      console.error("Error cleaning up old messages:", error);
      throw new Error(`Failed to cleanup old messages: ${error.message}`);
    }
  }
}

export const chatService = new ChatService();
export default chatService;
