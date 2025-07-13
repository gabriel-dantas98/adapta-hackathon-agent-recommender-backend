import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { env } from "../config/env";

class SummaryService {
  private llm: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.3,
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
    try {
      const prompt = this.createThreadSummaryPrompt();

      const messagesText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const input = {
        messages: messagesText,
        previous_summary:
          previousSummary || "Nenhum resumo anterior disponível",
        message_count: messages.length,
      };

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke(input);

      return summary.trim();
    } catch (error) {
      console.error("Error generating thread summary:", error);
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
    try {
      const prompt = this.createUserContextSummaryPrompt();

      const contextText = Object.entries(currentContext)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");

      const input = {
        current_context: contextText,
        thread_summary: threadSummary,
        previous_context_summary:
          previousContextSummary || "Nenhum contexto anterior disponível",
      };

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke(input);

      return summary.trim();
    } catch (error) {
      console.error("Error updating user context summary:", error);
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
    try {
      const prompt = this.createRecommendationContextPrompt();

      const contextText = Object.entries(userContext)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");

      const recentMessagesText = recentMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const input = {
        user_context: contextText,
        thread_summary: threadSummary,
        recent_messages: recentMessagesText,
      };

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke(input);

      return summary.trim();
    } catch (error) {
      console.error("Error generating recommendation context:", error);
      throw new Error("Failed to generate recommendation context");
    }
  }

  /**
   * Cria prompt para resumo de thread
   */
  private createThreadSummaryPrompt(): PromptTemplate {
    const template = `
Você é um assistente especializado em resumir conversas. Sua tarefa é criar um resumo conciso e informativo da seguinte conversa.

CONVERSA ({message_count} mensagens):
{messages}

RESUMO ANTERIOR:
{previous_summary}

INSTRUÇÕES:
1. Crie um resumo que capture os pontos principais da conversa
2. Inclua informações sobre intenções, necessidades e contexto do usuário
3. Se houver um resumo anterior, integre as informações relevantes
4. Mantenha o resumo entre 100-300 palavras
5. Use linguagem clara e objetiva
6. Foque em informações que seriam úteis para recomendações de produtos

RESUMO:`;

    return PromptTemplate.fromTemplate(template);
  }

  /**
   * Cria prompt para resumo de contexto do usuário
   */
  private createUserContextSummaryPrompt(): PromptTemplate {
    const template = `
Você é um assistente especializado em manter contexto de usuário. Sua tarefa é atualizar o contexto do usuário com base em novas informações.

CONTEXTO ATUAL:
{current_context}

RESUMO DA THREAD:
{thread_summary}

CONTEXTO ANTERIOR:
{previous_context_summary}

INSTRUÇÕES:
1. Atualize o contexto do usuário integrando as novas informações
2. Mantenha informações relevantes do contexto anterior
3. Priorize informações que ajudem em recomendações de produtos
4. Inclua preferências, necessidades e padrões de comportamento identificados
5. Mantenha o resumo entre 150-400 palavras
6. Use linguagem clara e estruturada

CONTEXTO ATUALIZADO:`;

    return PromptTemplate.fromTemplate(template);
  }

  /**
   * Cria prompt para contexto de recomendação
   */
  private createRecommendationContextPrompt(): PromptTemplate {
    const template = `
Você é um assistente especializado em preparar contexto para recomendações de produtos. Sua tarefa é criar um resumo focado em recomendações.

CONTEXTO DO USUÁRIO:
{user_context}

RESUMO DA THREAD:
{thread_summary}

MENSAGENS RECENTES:
{recent_messages}

INSTRUÇÕES:
1. Crie um resumo focado em necessidades e preferências do usuário
2. Identifique padrões de comportamento e interesse
3. Destaque requisitos específicos para produtos/soluções
4. Inclua informações sobre contexto de negócio se relevante
5. Mantenha o resumo entre 100-250 palavras
6. Use linguagem que facilite matching com produtos

CONTEXTO PARA RECOMENDAÇÃO:`;

    return PromptTemplate.fromTemplate(template);
  }
}

export const summaryService = new SummaryService();
export default summaryService;
