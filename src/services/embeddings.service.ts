import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { USER_ENHANCED_CONTEXT_PROMPT } from "@/lib/prompts";

class EmbeddingsService {
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService] Initializing with OpenAI API key: ${
        env.OPENAI_API_KEY ? "SET" : "NOT SET"
      }`
    );
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small", // ou 'text-embedding-ada-002'
      dimensions: 1536, // dimensão padrão para text-embedding-3-small
    });

    this.llm = new ChatOpenAI({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "o4-mini-2025-04-16",
      temperature: 1,
    });

    this.outputParser = new StringOutputParser();
  }

  /**
   * Gera embeddings para um texto
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const methodName = "generateEmbedding";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with text length: ${
        text.length
      }`
    );

    try {
      const startTime = Date.now();
      const embedding = await this.embeddings.embedQuery(text);
      const endTime = Date.now();

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated embedding with ${
          embedding.length
        } dimensions in ${endTime - startTime}ms`
      );
      return embedding;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating embedding:`,
        error
      );
      throw new Error("Failed to generate embedding");
    }
  }

  /**
   * Gera embeddings para múltiplos textos
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const methodName = "generateEmbeddings";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with ${
        texts.length
      } texts`
    );

    try {
      const startTime = Date.now();
      const embeddings = await this.embeddings.embedDocuments(texts);
      const endTime = Date.now();

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated ${
          embeddings.length
        } embeddings in ${endTime - startTime}ms`
      );
      return embeddings;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating embeddings:`,
        error
      );
      throw new Error("Failed to generate embeddings");
    }
  }

  /**
   * Combina metadata e prompt para gerar embedding (versão para solution products)
   */
  async generateEmbeddingFromMetadata(
    metadata: Record<string, any>,
    title: string,
    description: string,
    categories: string[]
  ): Promise<number[]> {
    const methodName = "generateEmbeddingFromMetadata";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with title: ${title}, categories: ${categories.join(
        ", "
      )}`
    );

    try {
      // Combina metadata e prompt em um texto para embedding
      const combinedText = this.combineMetadataAndPrompt(
        metadata,
        title,
        description,
        categories
      );

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combined text length: ${
          combinedText.length
        }`
      );

      const embedding = await this.generateEmbedding(combinedText);
      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated embedding from metadata`
      );
      return embedding;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating embedding from metadata:`,
        error
      );
      throw new Error("Failed to generate embedding from metadata");
    }
  }

  /**
   * Combina metadata e prompt para gerar embedding (versão para solution owners)
   */
  async generateEmbeddingFromOwnerMetadata(
    metadata: Record<string, any>,
    outputPrompt: Record<string, any>
  ): Promise<number[]> {
    const methodName = "generateEmbeddingFromOwnerMetadata";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with owner metadata`
    );

    try {
      // Combina metadata e prompt em um texto para embedding
      const combinedText = this.combineOwnerMetadataAndPrompt(
        metadata,
        outputPrompt
      );

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combined text length: ${
          combinedText.length
        }`
      );

      const embedding = await this.generateEmbedding(combinedText);
      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated embedding from owner metadata`
      );
      return embedding;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating embedding from owner metadata:`,
        error
      );
      throw new Error("Failed to generate embedding from owner metadata");
    }
  }

  /**
   * Combina metadata e prompt para gerar embedding (versão para user context)
   */
  async generateEmbeddingFromUserContext(
    metadata: Record<string, any>,
    outputPrompt: Record<string, any>
  ): Promise<number[]> {
    const methodName = "generateEmbeddingFromUserContext";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with user context metadata`
    );

    try {
      // Combina metadata e prompt em um texto para embedding
      const combinedText = this.combineOwnerMetadataAndPrompt(
        metadata,
        outputPrompt
      );

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combined text length: ${
          combinedText.length
        }`
      );

      const embedding = await this.generateEmbedding(combinedText);
      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated embedding from user context`
      );
      return embedding;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating embedding from user context:`,
        error
      );
      throw new Error("Failed to generate embedding from user context");
    }
  }

  /**
   * Calcula similaridade coseno entre dois vetores
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const methodName = "calculateCosineSimilarity";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with vectors of length: ${
        vectorA.length
      } and ${vectorB.length}`
    );

    if (vectorA.length !== vectorB.length) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Vector length mismatch: ${
          vectorA.length
        } vs ${vectorB.length}`
      );
      throw new Error("Vectors must have the same length");
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    const similarity = dotProduct / (magnitudeA * magnitudeB);
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Calculated similarity: ${similarity}`
    );
    return similarity;
  }

  /**
   * Combina metadata e prompt em um texto único (versão para solution products)
   */
  private combineMetadataAndPrompt(
    metadata: Record<string, any>,
    title: string,
    description: string,
    categories: string[]
  ): string {
    const methodName = "combineMetadataAndPrompt";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combining metadata for product: ${title}`
    );

    const metadataText = {
      ...metadata,
      title,
      description,
      categories: categories.join(", "),
    };

    const combinedText = JSON.stringify(metadataText);
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combined text:`,
      combinedText
    );
    return combinedText;
  }

  /**
   * Combina metadata e prompt em um texto único (versão para owners e user context)
   */
  private combineOwnerMetadataAndPrompt(
    metadata: Record<string, any>,
    outputPrompt: Record<string, any>
  ): string {
    const methodName = "combineOwnerMetadataAndPrompt";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combining owner metadata`
    );

    const metadataText = {
      ...metadata,
      ...outputPrompt,
    };

    const combinedText = JSON.stringify(metadataText);
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combined text:`,
      combinedText
    );
    return combinedText;
  }

  /**
   * Gera embedding para thread de chat
   */
  async generateThreadEmbedding(
    messages: Array<{ role: string; content: string }>,
    summary?: string
  ): Promise<number[]> {
    const methodName = "generateThreadEmbedding";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with ${
        messages.length
      } messages, summary: ${summary ? "provided" : "not provided"}`
    );

    try {
      // Combina mensagens em um texto único
      const messagesText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const combinedText = summary
        ? `Summary: ${summary}\n\nMessages:\n${messagesText}`
        : messagesText;

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Combined text length: ${
          combinedText.length
        }`
      );

      const embedding = await this.generateEmbedding(combinedText);
      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated thread embedding`
      );
      return embedding;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating thread embedding:`,
        error
      );
      throw new Error("Failed to generate thread embedding");
    }
  }

  private createRecommendationContextPrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(USER_ENHANCED_CONTEXT_PROMPT);
  }

  /**
   * Gera embedding para contexto de usuário
   */
  async generateUserContextEmbedding(
    metadata: Record<string, any>,
    outputPrompt: Record<string, any>,
    threadSummary?: string,
    currentContext?: string
  ): Promise<{ embedding: number[]; summary: string }> {
    const methodName = "generateUserContextEmbedding";
    console.log(
      `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Starting with user context, thread summary: ${
        threadSummary ? "provided" : "not provided"
      }`
    );

    try {
      const prompt = this.createRecommendationContextPrompt();

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const summary = await chain.invoke({
        currentContext: currentContext,
        threadSummary: threadSummary,
      });

      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Summary: ${summary}`
      );

      const embedding = await this.generateEmbedding(summary);
      console.log(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Successfully generated user context embedding`
      );
      return { embedding, summary };
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [EmbeddingsService.${methodName}] Error generating user context embedding:`,
        error
      );
      throw new Error("Failed to generate user context embedding");
    }
  }
}

export const embeddingsService = new EmbeddingsService();
export default embeddingsService;
