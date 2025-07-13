import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { env } from "../config/env";
import {
  RECOMMENDATION_CONTEXT_PROMPT,
  THREAD_SUMMARY_PROMPT,
  USER_CONTEXT_SUMMARY_PROMPT,
} from "@/lib/prompts";

class SummaryService {
  private llm: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    console.log(
      `[${new Date().toISOString()}] [SummaryService] Initializing with OpenAI API key: ${
        env.OPENAI_API_KEY ? "SET" : "NOT SET"
      }`
    );
    this.llm = new ChatOpenAI({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "gpt-4o-2024-08-06",
      temperature: 1,
    });

    this.outputParser = new StringOutputParser();
  }

  /**
   * Gera resumo de uma thread de chat
   */
  async generateThreadSummary(
    messages: Array<{ role: string; content: string; timestamp?: string }>,
    previousSummary?: string
  ): Promise<string> {
    const methodName = "generateThreadSummary";
    console.log(
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Starting with ${
        messages.length
      } messages, previous summary: ${
        previousSummary ? "provided" : "not provided"
      }`
    );

    try {
      const prompt = this.createThreadSummaryPrompt();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Created thread summary prompt`
      );

      const messagesText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Messages text length: ${
          messagesText.length
        } characters`
      );

      const input = {
        messages: messagesText,
        previous_summary:
          previousSummary || "Nenhum resumo anterior disponível",
        message_count: messages.length,
      };

      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Preparing to invoke LLM chain`
      );
      const startTime = Date.now();

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke(input);

      const endTime = Date.now();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] LLM invocation completed in ${
          endTime - startTime
        }ms`
      );

      const trimmedSummary = summary.trim();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Generated summary length: ${
          trimmedSummary.length
        } characters`
      );

      return trimmedSummary;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Error occurred:`,
        error
      );
      throw new Error("Failed to generate thread summary");
    }
  }

  /**
   * Atualiza resumo do contexto do usuário
   */
  async updateUserContextSummary(
    currentContext: Record<string, any>,
    threadSummary: string,
    previousContextSummary?: string
  ): Promise<string> {
    const methodName = "updateUserContextSummary";
    console.log(
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Starting with thread summary length: ${
        threadSummary.length
      }, previous context summary: ${
        previousContextSummary ? "provided" : "not provided"
      }`
    );

    try {
      const prompt = this.createUserContextSummaryPrompt();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Created user context summary prompt`
      );

      const contextText = Object.entries(currentContext)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");

      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Context text length: ${
          contextText.length
        } characters`
      );

      const input = {
        current_context: contextText,
        thread_summary: threadSummary,
        previous_context_summary:
          previousContextSummary || "Nenhum contexto anterior disponível",
      };

      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Preparing to invoke LLM chain`
      );
      const startTime = Date.now();

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke(input);

      const endTime = Date.now();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] LLM invocation completed in ${
          endTime - startTime
        }ms`
      );

      const trimmedSummary = summary.trim();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Generated summary length: ${
          trimmedSummary.length
        } characters`
      );

      return trimmedSummary;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Error occurred:`,
        error
      );
      throw new Error("Failed to update user context summary");
    }
  }

  /**
   * Gera resumo para recomendações
   */
  async generateRecommendationContext(
    userContext: Record<string, any>,
    threadSummary: string,
    recentMessages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const methodName = "generateRecommendationContext";
    console.log(
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Starting with thread summary length: ${
        threadSummary.length
      }, recent messages: ${recentMessages.length}`
    );

    try {
      const prompt = this.createRecommendationContextPrompt();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Created recommendation context prompt`
      );

      const contextText = Object.entries(userContext)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");

      const recentMessagesText = recentMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Context text length: ${
          contextText.length
        }, recent messages text length: ${recentMessagesText.length}`
      );

      const input = {
        user_context: contextText,
        thread_summary: threadSummary,
        recent_messages: recentMessagesText,
      };

      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Preparing to invoke LLM chain`
      );
      const startTime = Date.now();

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke(input);

      const endTime = Date.now();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] LLM invocation completed in ${
          endTime - startTime
        }ms`
      );

      const trimmedSummary = summary.trim();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Generated summary length: ${
          trimmedSummary.length
        } characters`
      );

      return trimmedSummary;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Error occurred:`,
        error
      );
      throw new Error("Failed to generate recommendation context");
    }
  }

  /**
   * Cria prompt para resumo de thread
   */
  private createThreadSummaryPrompt(): PromptTemplate {
    const methodName = "createThreadSummaryPrompt";
    console.log(
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Creating thread summary prompt template`
    );

    return PromptTemplate.fromTemplate(THREAD_SUMMARY_PROMPT);
  }

  /**
   * Cria prompt para resumo de contexto do usuário
   */
  private createUserContextSummaryPrompt(): PromptTemplate {
    const methodName = "createUserContextSummaryPrompt";
    console.log(
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Creating user context summary prompt template`
    );

    return PromptTemplate.fromTemplate(USER_CONTEXT_SUMMARY_PROMPT);
  }

  /**
   * Cria prompt para contexto de recomendação
   */
  private createRecommendationContextPrompt(): PromptTemplate {
    const methodName = "createRecommendationContextPrompt";
    console.log(
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Creating recommendation context prompt template`
    );

    return PromptTemplate.fromTemplate(RECOMMENDATION_CONTEXT_PROMPT);
  }
}

export const summaryService = new SummaryService();
export default summaryService;
