import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env";

class EmbeddingsService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small", // ou 'text-embedding-ada-002'
      dimensions: 1536, // dimensão padrão para text-embedding-3-small
    });
  }

  /**
   * Gera embeddings para um texto
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  /**
   * Gera embeddings para múltiplos textos
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
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
    try {
      // Combina metadata e prompt em um texto para embedding
      const combinedText = this.combineMetadataAndPrompt(
        metadata,
        title,
        description,
        categories
      );

      return await this.generateEmbedding(combinedText);
    } catch (error) {
      console.error("Error generating embedding from metadata:", error);
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
    try {
      // Combina metadata e prompt em um texto para embedding
      const combinedText = this.combineOwnerMetadataAndPrompt(
        metadata,
        outputPrompt
      );

      return await this.generateEmbedding(combinedText);
    } catch (error) {
      console.error("Error generating embedding from owner metadata:", error);
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
    try {
      // Combina metadata e prompt em um texto para embedding
      const combinedText = this.combineOwnerMetadataAndPrompt(
        metadata,
        outputPrompt
      );

      return await this.generateEmbedding(combinedText);
    } catch (error) {
      console.error("Error generating embedding from user context:", error);
      throw new Error("Failed to generate embedding from user context");
    }
  }

  /**
   * Calcula similaridade coseno entre dois vetores
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error("Vectors must have the same length");
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    return dotProduct / (magnitudeA * magnitudeB);
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
    const metadataText = {
      ...metadata,
      title,
      description,
      categories: categories.join(", "),
    };
    console.log("[COMBINE METADATA AND PROMPT]: ", metadataText);
    return JSON.stringify(metadataText);
  }

  /**
   * Combina metadata e prompt em um texto único (versão para owners e user context)
   */
  private combineOwnerMetadataAndPrompt(
    metadata: Record<string, any>,
    outputPrompt: Record<string, any>
  ): string {
    const metadataText = {
      ...metadata,
      ...outputPrompt,
    };
    console.log("[COMBINE OWNER METADATA AND PROMPT]: ", metadataText);
    return JSON.stringify(metadataText);
  }

  /**
   * Gera embedding para thread de chat
   */
  async generateThreadEmbedding(
    messages: Array<{ role: string; content: string }>,
    summary?: string
  ): Promise<number[]> {
    try {
      // Combina mensagens em um texto único
      const messagesText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const combinedText = summary
        ? `Summary: ${summary}\n\nMessages:\n${messagesText}`
        : messagesText;

      return await this.generateEmbedding(combinedText);
    } catch (error) {
      console.error("Error generating thread embedding:", error);
      throw new Error("Failed to generate thread embedding");
    }
  }

  /**
   * Gera embedding para contexto de usuário
   */
  async generateUserContextEmbedding(
    metadata: Record<string, any>,
    outputPrompt: Record<string, any>,
    threadSummary?: string
  ): Promise<number[]> {
    try {
      const baseText = this.combineOwnerMetadataAndPrompt(
        metadata,
        outputPrompt
      );
      const combinedText = threadSummary
        ? `${baseText} | Thread Summary: ${threadSummary}`
        : baseText;

      return await this.generateEmbedding(combinedText);
    } catch (error) {
      console.error("Error generating user context embedding:", error);
      throw new Error("Failed to generate user context embedding");
    }
  }
}

export const embeddingsService = new EmbeddingsService();
export default embeddingsService;
