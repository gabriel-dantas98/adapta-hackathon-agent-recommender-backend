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
      `[${new Date().toISOString()}] [SummaryService] Initializing with OpenAI API key: ${env.OPENAI_API_KEY ? "SET" : "NOT SET"
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
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Starting with ${messages.length
      } messages, previous summary: ${previousSummary ? "provided" : "not provided"
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
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Messages text length: ${messagesText.length
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
        `[${new Date().toISOString()}] [SummaryService.${methodName}] LLM invocation completed in ${endTime - startTime
        }ms`
      );

      const trimmedSummary = summary.trim();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Generated summary length: ${trimmedSummary.length
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
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Starting with thread summary length: ${threadSummary.length
      }, previous context summary: ${previousContextSummary ? "provided" : "not provided"
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
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Context text length: ${contextText.length
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
        `[${new Date().toISOString()}] [SummaryService.${methodName}] LLM invocation completed in ${endTime - startTime
        }ms`
      );

      const trimmedSummary = summary.trim();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Generated summary length: ${trimmedSummary.length
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
      `[${new Date().toISOString()}] [SummaryService.${methodName}] Starting with thread summary length: ${threadSummary.length
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
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Context text length: ${contextText.length
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
        `[${new Date().toISOString()}] [SummaryService.${methodName}] LLM invocation completed in ${endTime - startTime
        }ms`
      );

      const trimmedSummary = summary.trim();
      console.log(
        `[${new Date().toISOString()}] [SummaryService.${methodName}] Generated summary length: ${trimmedSummary.length
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
 * Classifica a intenção de compra do usuário com base no histórico da thread
 */
  async classifyPurchaseIntent(
    threadSummary: string,
    recentMessages: Array<{ role: string; content: string }>
  ): Promise<{
    intencao_compra: "alta" | "moderada" | "baixa";
    score: number;
    justificativa: string;
  }> {
    const methodName = "classifyPurchaseIntent";
    console.log(
      `[${new Date().toISOString()}] [IntentService.${methodName}] Starting with thread summary length: ${threadSummary.length}, recent messages: ${recentMessages.length}`
    );

    try {
      const prompt = this.createPurchaseIntentPrompt();
      console.log(
        `[${new Date().toISOString()}] [IntentService.${methodName}] Created purchase intent prompt`
      );

      const recentMessagesText = recentMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const input = {
        thread_summary: threadSummary,
        recent_messages: recentMessagesText,
      };

      console.log(
        `[${new Date().toISOString()}] [IntentService.${methodName}] Preparing to invoke LLM chain`
      );
      const startTime = Date.now();

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const intentResult = await chain.invoke(input);

      const endTime = Date.now();
      console.log(
        `[${new Date().toISOString()}] [IntentService.${methodName}] LLM invocation completed in ${endTime - startTime}ms`
      );

      let trimmed = intentResult.trim(); // ```{}```
      
      console.log(
        `[${new Date().toISOString()}] [IntentService.${methodName}] Raw intent result: ${trimmed}`
      );
      const match = trimmed.match(/\{[\s\S]*?\}/);
      if (!match) {
        throw new Error("No valid JSON object found in LLM response");
      }

      const parsed = JSON.parse(match[0]);

      console.log(
        `[${new Date().toISOString()}] [IntentService.${methodName}] Parsed result: ${JSON.stringify(parsed)}`
      );

      return parsed;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [IntentService.${methodName}] Error occurred:`,
        error
      );
      throw new Error("Failed to classify purchase intent");
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

  /**
   * Cria prompt para classificação de intenção de compra
   */
  private createPurchaseIntentPrompt() {
  return PromptTemplate.fromTemplate(`Você é um classificador de intenção de compra em uma conversa entre um usuário e uma IA.

Sua tarefa é analisar cuidadosamente a conversa para identificar se o usuário **realmente demonstra uma intenção concreta de adquirir um produto ou serviço** — e não apenas curiosidade ou conversas genéricas.

Use os seguintes critérios para classificar a intenção de compra:

1. O usuário **expressa uma dor real, necessidade específica ou desejo com contexto pessoal**
2. Ele **pede ajuda ou sugestões com tom de urgência, decisão ou ação próxima**
3. O histórico da conversa tem **pelo menos duas mensagens significativas** do usuário
4. O tom indica que o usuário está **mais próximo da ação do que da exploração**

Evite marcar como intenção moderada/alta quando:
- O usuário apenas faz perguntas vagas ou genéricas (“o que posso dar de presente?”)
- O histórico é muito curto ou sem contexto
- A conversa está no início, sem sinais claros de ação

Sua saída deve ser um JSON com o seguinte formato json:
  "intencao_compra": "alta" | "moderada" | "baixa"
  "score": 0-100
  "justificativa": ""

Use senso crítico. Seja rigoroso. Pense como alguém que precisa **economizar recursos e não desperdiçar recomendação se a intenção não for real.**

Dados disponíveis:
- Resumo da thread: {thread_summary}
- Mensagens recentes: {recent_messages}
`);
}
}

export const summaryService = new SummaryService();
export default summaryService;
