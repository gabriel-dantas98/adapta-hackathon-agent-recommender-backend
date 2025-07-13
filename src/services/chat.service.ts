import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { embeddingsService } from "./embeddings.service";
import { summaryService } from "./summary.service";
import { chatHistoryRepository } from "../repositories/chat-history.repository";
import { userEnhancedContextRepository } from "../repositories/user-enhanced-context.repository";
import { ChatMessage } from "../types/dtos";
import { env } from "../config/env";
import {
  RecommendationListResponse,
  UserEnhancedContextResponse,
} from "../types/dtos";
import { CREATE_CHAT_RESPONSE_PROMPT } from "@/lib/prompts";

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
    const methodName = "processMessage";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting with sessionId: ${sessionId}, userId: ${
        userId || "not provided"
      }`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Preparing to save message to history`
      );

      // 1. Salvar mensagem no histórico
      const chatMessage: ChatMessage = {
        session_id: sessionId,
        message: message,
        user_id: userId,
      };

      const savedMessage = await chatHistoryRepository.create(chatMessage);
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Message saved with ID: ${
          savedMessage.id
        }`
      );

      // 2. Buscar histórico completo da thread
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Fetching complete thread history`
      );
      const allMessages = await chatHistoryRepository.findAllBySessionId(
        sessionId
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Retrieved ${
          allMessages.length
        } messages from thread`
      );

      // 3. Gerar resumo da thread
      const chatMessages = allMessages.map((msg) => ({
        role: msg.message.role || "user",
        content: msg.message.content || JSON.stringify(msg.message),
        timestamp: msg.id.toString(),
      }));

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Generating thread summary`
      );
      const threadSummary = await summaryService.generateThreadSummary(
        chatMessages
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Thread summary generated, length: ${
          threadSummary.length
        } characters`
      );

      // 4. Gerar embedding da thread
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Generating thread embedding`
      );
      const threadEmbedding = await embeddingsService.generateThreadEmbedding(
        chatMessages,
        threadSummary
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Thread embedding generated with dimension: ${
          threadEmbedding.length
        }`
      );

      // 5. Atualizar contexto do usuário (se fornecido)
      let userContextUpdated = false;
      if (userId) {
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] Updating user context for userId: ${userId}`
        );
        try {
          const updatedContext =
            await userEnhancedContextRepository.updateWithThreadSummary(
              userId,
              threadSummary
            );
          userContextUpdated = !!updatedContext;
          console.log(
            `[${new Date().toISOString()}] [ChatService.${methodName}] User context updated: ${userContextUpdated}`
          );
        } catch (error) {
          console.warn(
            `[${new Date().toISOString()}] [ChatService.${methodName}] Failed to update user context:`,
            error
          );
        }
      } else {
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] No userId provided, skipping user context update`
        );
      }

      const result = {
        messageId: savedMessage.id,
        threadSummary,
        userContextUpdated,
      };

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Successfully processed message`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to process message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
    const methodName = "getThreadHistory";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting with sessionId: ${sessionId}, limit: ${limit}, offset: ${offset}`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Fetching messages from repository`
      );
      const messages = await chatHistoryRepository.findBySessionId(
        sessionId,
        limit,
        offset
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Retrieved ${
          messages.length
        } messages`
      );

      const total = await chatHistoryRepository.getMessageCount(sessionId);
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Total message count: ${total}`
      );

      // Gerar resumo se houver mensagens
      let summary: string | undefined;
      if (messages.length > 0) {
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] Generating thread summary`
        );
        const chatMessages = messages.map((msg) => ({
          role: msg.message.role || "user",
          content: msg.message.content || JSON.stringify(msg.message),
        }));

        summary = await summaryService.generateThreadSummary(chatMessages);
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] Thread summary generated, length: ${
            summary.length
          } characters`
        );
      } else {
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] No messages found, skipping summary generation`
        );
      }

      const result = {
        messages: messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          timestamp: msg.id.toString(),
        })),
        total,
        summary,
      };

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Successfully retrieved thread history`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to get thread history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Busca threads de um usuário
   */
  async getUserThreads(userId: string): Promise<
    Array<{
      session_id: string;
      message_count: number;
      last_activity: string;
      summary?: string;
      messages: Array<{
        id: number;
        message: Record<string, any>;
        timestamp: string;
      }>;
    }>
  > {
    const methodName = "getUserThreads";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting with userId: ${userId}`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Fetching user sessions`
      );
      const sessions = await chatHistoryRepository.findSessionsByUserId(userId);
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Found ${
          sessions.length
        } sessions for user`
      );

      // Para cada sessão, buscar mensagens e gerar resumo
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Processing sessions with details`
      );
      const threadsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          console.log(
            `[${new Date().toISOString()}] [ChatService.${methodName}] Processing session: ${
              session.session_id
            }`
          );

          const allMessages = await chatHistoryRepository.findAllBySessionId(
            session.session_id
          );
          console.log(
            `[${new Date().toISOString()}] [ChatService.${methodName}] Found ${
              allMessages.length
            } messages in session ${session.session_id}`
          );

          let summary: string | undefined;
          if (allMessages.length > 0) {
            console.log(
              `[${new Date().toISOString()}] [ChatService.${methodName}] Generating summary for session ${
                session.session_id
              }`
            );
            const chatMessages = allMessages.map((msg) => ({
              role: msg.message.role || "user",
              content: msg.message.content || JSON.stringify(msg.message),
            }));

            summary = await summaryService.generateThreadSummary(chatMessages);
            console.log(
              `[${new Date().toISOString()}] [ChatService.${methodName}] Summary generated for session ${
                session.session_id
              }, length: ${summary.length} characters`
            );
          }

          return {
            session_id: session.session_id,
            message_count: session.message_count,
            last_activity: session.last_activity,
            summary,
            messages: allMessages.map((msg) => ({
              id: msg.id,
              message: msg.message,
              timestamp: msg.id.toString(),
            })),
          };
        })
      );

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Successfully processed ${
          threadsWithDetails.length
        } threads`
      );
      return threadsWithDetails;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to get user threads: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
    const methodName = "searchMessages";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting with query: "${query}", sessionId: ${
        sessionId || "not provided"
      }, limit: ${limit}`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Searching messages by text`
      );
      // Buscar mensagens por texto
      const messages = await chatHistoryRepository.searchMessages(
        query,
        sessionId,
        limit
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Found ${
          messages.length
        } messages matching text search`
      );

      // Gerar embedding para a query
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Generating query embedding`
      );
      const queryEmbedding = await embeddingsService.generateEmbedding(query);
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Query embedding generated with dimension: ${
          queryEmbedding.length
        }`
      );

      // Calcular relevância de cada mensagem
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Calculating relevance scores`
      );
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

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Calculated relevance scores for ${
          messagesWithRelevance.length
        } messages`
      );

      // Ordenar por relevância
      messagesWithRelevance.sort(
        (a, b) => b.relevance_score - a.relevance_score
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Sorted messages by relevance score`
      );

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Successfully completed message search`
      );
      return messagesWithRelevance;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to search messages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Analisa padrões de conversação
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
    const methodName = "analyzeConversationPatterns";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting with userId: ${userId}, daysBack: ${daysBack}`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Calculating date range`
      );
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const endDate = new Date();

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Searching sessions in date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );

      const sessions = await chatHistoryRepository.findSessionsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Found ${
          sessions.length
        } sessions in date range`
      );

      const totalMessages = sessions.reduce(
        (sum, session) => sum + session.message_count,
        0
      );
      const activeSessions = sessions.length;
      const avgMessagesPerSession =
        activeSessions > 0 ? totalMessages / activeSessions : 0;

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Calculated stats - Total messages: ${totalMessages}, Active sessions: ${activeSessions}, Avg per session: ${avgMessagesPerSession.toFixed(
          2
        )}`
      );

      // Análise de tópicos comuns - implementação simplificada
      const commonTopics = [
        { topic: "general", frequency: Math.floor(Math.random() * 10) },
        { topic: "technical", frequency: Math.floor(Math.random() * 5) },
        { topic: "support", frequency: Math.floor(Math.random() * 3) },
      ];

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Generated common topics (simplified)`
      );

      const result = {
        total_messages: totalMessages,
        active_sessions: activeSessions,
        avg_messages_per_session: avgMessagesPerSession,
        common_topics: commonTopics,
      };

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Successfully analyzed conversation patterns`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to analyze conversation patterns: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gera resposta baseada em contexto
   */
  async generateResponse(
    threadSummary: string,
    userContext: UserEnhancedContextResponse | null,
    recommendations?: RecommendationListResponse
  ): Promise<{
    response: string;
    recommendations_used: number;
    context_summary: string;
  }> {
    const methodName = "generateResponse";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting with thread summary length: ${
        threadSummary.length
      }, user context: ${
        userContext ? "provided" : "not provided"
      }, recommendations: ${
        recommendations ? recommendations.recommendations.length : 0
      }`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Creating chat response prompt`
      );
      const prompt = this.createChatResponsePrompt();

      const contextSummary = userContext
        ? `User: ${userContext.user_id}, Context: ${JSON.stringify(
            userContext.metadata
          )}`
        : "No user context available";

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Context summary prepared: ${contextSummary.substring(
          0,
          100
        )}...`
      );

      const recommendationsText = recommendations
        ? recommendations.recommendations
            .map((rec) => `${rec.product_id}: ${rec.similarity_score}`)
            .join(", ")
        : "No recommendations available";

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Recommendations text prepared: ${recommendationsText.substring(
          0,
          100
        )}...`
      );

      const input = {
        thread_summary: threadSummary,
        user_context: contextSummary,
        recommendations: recommendationsText,
      };

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Initializing LLM and preparing to generate response`
      );
      const llm = new ChatOpenAI({
        openAIApiKey: env.OPENAI_API_KEY,
        modelName: "o4-mini-2025-04-16",
        temperature: 1,
      });

      const outputParser = new StringOutputParser();
      const chain = prompt.pipe(llm).pipe(outputParser);

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Invoking LLM chain`
      );
      const startTime = Date.now();
      const response = await chain.invoke(input);
      const endTime = Date.now();

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] LLM response generated in ${
          endTime - startTime
        }ms, length: ${response.length} characters`
      );

      const result = {
        response: response.trim(),
        recommendations_used: recommendations?.recommendations.length || 0,
        context_summary: contextSummary,
      };

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Successfully generated response`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to generate response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Cria prompt para resposta de chat
   */
  private createChatResponsePrompt(): PromptTemplate {
    const methodName = "createChatResponsePrompt";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Creating chat response prompt template`
    );

    return PromptTemplate.fromTemplate(CREATE_CHAT_RESPONSE_PROMPT);
  }

  /**
   * Limpeza de mensagens antigas
   */
  async cleanupOldMessages(daysOld: number = 90): Promise<number> {
    const methodName = "cleanupOldMessages";
    console.log(
      `[${new Date().toISOString()}] [ChatService.${methodName}] Starting cleanup of messages older than ${daysOld} days`
    );

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Cutoff date: ${cutoffDate.toISOString()}`
      );

      const countBefore = await chatHistoryRepository.getMessageCount("all");
      console.log(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Total messages before cleanup: ${countBefore}`
      );

      const success = await chatHistoryRepository.deleteOldMessages(daysOld);

      if (success) {
        const countAfter = await chatHistoryRepository.getMessageCount("all");
        const deletedCount = countBefore - countAfter;
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] Cleanup completed. Deleted ${deletedCount} messages`
        );
        return deletedCount;
      } else {
        console.log(
          `[${new Date().toISOString()}] [ChatService.${methodName}] Cleanup failed`
        );
        return 0;
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ChatService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(
        `Failed to cleanup old messages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const chatService = new ChatService();
export default chatService;
