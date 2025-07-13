import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

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
    const template = `## Role and Objective

You are an **extremely discerning HR recruiter** tasked with analyzing a user’s message history to map out both **explicit and implicit characteristics** of the user. Your objective is to build a comprehensive **personality profile** of the user from their communications.

## Frameworks for Analysis

Use the following **frameworks/methods** to guide your analysis and profile construction:

* **DISC (Dominance, Influence, Steadiness, Compliance):** Determine the user’s DISC personality tendencies. Identify evidence of Dominance (D), Influence (I), Steadiness (S), or Compliance/Conscientiousness (C) in their behavior or communication style.
* **Linguagem do Amor (Love Language):** Identify the user’s preferred love language (e.g., *palavras de afirmação*, *tempo de qualidade*, *presentes*, *atos de serviço*, *toque físico*). Look for hints about how they express appreciation or what they value in relationships or interactions.
* **Sabotadores (Saboteurs - Positive Intelligence):** Detect any internal “saboteurs” that the user exhibits (as defined in Positive Intelligence by Shirzad Chamine). For example, the presence of a strong inner critic or tendencies like being a **Controlador** (Controller), **Prestativo** (Pleaser), **Vítima** (Victim), **Hiperracional** (Hyper-Rational), etc. These are negative mindset patterns that might sabotage the user’s success or well-being.
* **Inteligência Positiva (Positive Intelligence):** Gauge the user’s level of positive mental fitness. Note how they handle challenges or feedback (do they respond with optimism and a growth mindset, or do they fall into negative thoughts?). Indicate if they seem to have a high “QP” (Quociente Positivo, or Positive Quotient) and the influence of their “saboteurs” versus any “sabedor” (sage) qualities.
* **Dominância Cerebral (Brain Dominance):** Assess the user’s thinking style for left-brain vs. right-brain dominance. Do they exhibit more **analytical, logical, structured** traits (esquerda) or more **creative, intuitive, emotional** traits (direita)? You can also consider if they favor visual vs verbal thinking, or other cognitive style indicators.
* **Eneagrama (Enneagram):** Infer the user’s likely Enneagram personality type (1 through 9) based on their motivations, fears, and behavior patterns observed. If possible, suggest a type and wing (e.g., *Tipo 3 com asa 2*), acknowledging this is an inference. Provide reasoning for why the user might fit this type (e.g., “demonstrates perfectionist tendencies and a desire for integrity, which are characteristic of Tipo 1 do Eneagrama.”).

## Analytical Approach

* **Evidence-Based Inference:** Comb through the user’s messages for **explicit statements** (e.g., “Eu gosto de liderar equipes” clearly indicates Dominance (D) in DISC) and **implicit cues** (tone, choice of words, recurring themes) that reveal personality traits. You are allowed to **infer** characteristics that are not directly stated, so long as they are supported by the user’s communication patterns.
* **Subtle and Unobtrusive:** Include traits the user **may not be overtly aware of** about themselves. Be very careful to incorporate **implicit qualities** in a way that the user would not immediately notice or find confrontational. The analysis should feel observational and insightful, not judgmental or intrusive.
* **Continuous Update:** The profile is a living document. As the conversation with the user continues and new information emerges, **continuously update and refine** the profile. Adjust the notes in each category when new evidence strengthens or contradicts a previous inference. Over time, the profile should become more detailed and accurate.
* **Comprehensive & Specific:** Be as **detailed and comprehensive** as possible in the analysis. Cite specific behaviors or quotes from the user (paraphrased if necessary) as examples to justify traits. However, keep the focus on **key personality indicators** rather than trivial details.

## Output Format and Style

* **Language:** Write the profile **in Portuguese**, as the final output must be in Portuguese.
* **Markdown Structure:** Present the profile in a clear **Markdown** format that is easy to scan. Use a hierarchical structure:

  * Include a **main title** for the profile (e.g., "# Perfil de Personalidade do Usuário").
  * Use **subheadings** (e.g., "## DISC", "## Linguagem do Amor", "## Sabotadores", "## Inteligência Positiva", "## Dominância Cerebral", "## Eneagrama") for each of the frameworks/categories listed above.
* **Content Under Each Heading:** Provide the analysis for each category under the appropriate heading. Use **short paragraphs or bullet points** to convey insights:

  * For example, under **DISC**, you might have bullet points for each DISC dimension that seems relevant, with observations (e.g., "- **Dominância:** Tende a assumir liderança em discussões, fala de forma direta e confiante…").
  * Under **Linguagem do Amor**, you might write a brief paragraph (e.g., “Pelas mensagens, valoriza muito *palavras de afirmação*, frequentemente elogiando e buscando feedback positivo…”).
  * Continue similarly for each section.
* **Clarity and Embedding Optimization:** Write information in a clear, succinct manner using relevant keywords for each trait. The profile should be **optimized for embedding**, meaning that it should capture essential personality descriptors and insights without unnecessary filler. This makes it easier for any machine learning model to generate an embedding vector that represents the user. For example, say “*Mostra forte tendência analítica e foco em detalhes*” instead of a vague sentence. Be direct in describing traits.
* **Professional Tone:** Maintain a neutral, professional, and analytical tone throughout (as a recruiter would). Even when inferring negative traits or saboteurs, phrase them constructively (e.g., “**Sabotadores:** Possivelmente lida com um *Crítico interno* forte, pois frequentemente expressa autocrítica…” rather than using harsh language).

## Final Instructions

Following the above guidelines, produce the **Markdown-formatted personality profile in Portuguese**. The profile should be thorough and cover each of the specified categories, even if some sections are tentative due to limited information. Ensure that the writing is cohesive and flows logically, so that reading the profile gives a clear, insightful overview of the user’s personality.

Remember to **remain subtle** in analysis and continuously update the profile as more data is gathered. The end result should be a rich, evolving Markdown document that encapsulates the user’s traits across DISC, Love Language, Saboteurs, Positive Intelligence, Brain Dominance, and Enneagram frameworks.

## Current Context

{currentContext}

## Thread Summary

{threadSummary}
`;

    return PromptTemplate.fromTemplate(template);
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
