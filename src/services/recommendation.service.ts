import { embeddingsService } from "./embeddings.service";
import { summaryService } from "./summary.service";
import { solutionProductRepository } from "../repositories/solution-product.repository";
import { userEnhancedContextRepository } from "../repositories/user-enhanced-context.repository";
import { chatHistoryRepository } from "../repositories/chat-history.repository";
import {
  RecommendationRequest,
  RecommendationListResponse,
} from "../types/dtos";

class RecommendationService {
  /**
   * Gera recomendações baseadas no contexto do usuário e thread atual
   */
  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationListResponse> {
    try {
      const {
        user_id,
        session_id,
        limit = 10,
        similarity_threshold = 0.7,
      } = request;

      // 1. Buscar contexto do usuário
      const userContext = await userEnhancedContextRepository.findByUserId(
        user_id
      );
      if (!userContext) {
        throw new Error(
          "User context not found. Please complete onboarding first."
        );
      }

      // 2. Buscar histórico da thread (se fornecido)
      let threadEmbedding: number[] | null = null;
      let threadSummary: string | undefined;

      if (session_id) {
        const messages = await chatHistoryRepository.findRecentBySessionId(
          session_id,
          10
        );

        if (messages.length > 0) {
          // Gerar resumo da thread atual
          const chatMessages = messages.map((msg) => ({
            role: msg.message.role || "user",
            content: msg.message.content || JSON.stringify(msg.message),
          }));

          threadSummary = await summaryService.generateThreadSummary(
            chatMessages
          );
          threadEmbedding = await embeddingsService.generateThreadEmbedding(
            chatMessages,
            threadSummary
          );
        }
      }

      // 3. Combinar embeddings do contexto do usuário com thread atual
      let searchEmbedding: number[];

      if (threadEmbedding && userContext.embeddings) {
        // Combinar embeddings com peso (70% contexto usuário, 30% thread atual)
        searchEmbedding = this.combineEmbeddings(
          userContext.embeddings,
          threadEmbedding,
          0.7,
          0.3
        );
      } else if (userContext.embeddings) {
        searchEmbedding = userContext.embeddings;
      } else {
        throw new Error("No embeddings available for recommendation");
      }

      // 4. Buscar produtos similares
      const similarProducts = await solutionProductRepository.findWithOwnerInfo(
        searchEmbedding,
        similarity_threshold,
        limit
      );

      // 5. Formatar resposta
      const recommendations = similarProducts.map((product) => ({
        product_id: product.product_id,
        similarity_score: product.similarity_score,
        metadata: product.metadata,
        output_base_prompt: product.output_base_prompt,
        owner_info: {
          company_name: product.owner_info.company_name,
          domain: product.owner_info.domain,
        },
      }));

      // 6. Gerar contexto de recomendação
      let userContextSummary: string | undefined;
      if (threadSummary) {
        const recentMessages = session_id
          ? await chatHistoryRepository.findRecentBySessionId(session_id, 5)
          : [];

        const chatMessages = recentMessages.map((msg) => ({
          role: msg.message.role || "user",
          content: msg.message.content || JSON.stringify(msg.message),
        }));

        userContextSummary = await summaryService.generateRecommendationContext(
          userContext.metadata,
          threadSummary,
          chatMessages
        );
      }

      return {
        recommendations,
        total: recommendations.length,
        user_context_summary: userContextSummary,
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Busca produtos por texto livre
   */
  async searchProductsByText(
    query: string,
    limit: number = 10,
    similarity_threshold: number = 0.7
  ): Promise<RecommendationListResponse> {
    try {
      // Gerar embedding para a query
      const queryEmbedding = await embeddingsService.generateEmbedding(query);

      // Buscar produtos similares
      const similarProducts = await solutionProductRepository.findWithOwnerInfo(
        queryEmbedding,
        similarity_threshold,
        limit
      );

      const recommendations = similarProducts.map((product) => ({
        product_id: product.product_id,
        similarity_score: product.similarity_score,
        metadata: product.metadata,
        output_base_prompt: product.output_base_prompt,
        owner_info: {
          company_name: product.owner_info.company_name,
          domain: product.owner_info.domain,
        },
      }));

      return {
        recommendations,
        total: recommendations.length,
        user_context_summary: `Search results for: "${query}"`,
      };
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  /**
   * Recomendações baseadas em produtos similares
   */
  async findSimilarProducts(
    productId: string,
    limit: number = 5,
    similarity_threshold: number = 0.8
  ): Promise<RecommendationListResponse> {
    try {
      // Buscar o produto de referência
      const referenceProduct = await solutionProductRepository.findByProductId(
        productId
      );
      if (!referenceProduct || !referenceProduct.embeddings) {
        throw new Error("Reference product not found or has no embeddings");
      }

      // Buscar produtos similares
      const similarProducts = await solutionProductRepository.findWithOwnerInfo(
        referenceProduct.embeddings,
        similarity_threshold,
        limit + 1 // +1 para excluir o próprio produto
      );

      // Remover o produto de referência dos resultados
      const filteredProducts = similarProducts
        .filter((product) => product.product_id !== productId)
        .slice(0, limit);

      const recommendations = filteredProducts.map((product) => ({
        product_id: product.product_id,
        similarity_score: product.similarity_score,
        metadata: product.metadata,
        output_base_prompt: product.output_base_prompt,
        owner_info: {
          company_name: product.owner_info.company_name,
          domain: product.owner_info.domain,
        },
      }));

      return {
        recommendations,
        total: recommendations.length,
        user_context_summary: `Products similar to ${
          referenceProduct.metadata.name || productId
        }`,
      };
    } catch (error) {
      console.error("Error finding similar products:", error);
      throw new Error(`Failed to find similar products: ${error.message}`);
    }
  }

  /**
   * Combina dois embeddings com pesos especificados
   */
  private combineEmbeddings(
    embedding1: number[],
    embedding2: number[],
    weight1: number,
    weight2: number
  ): number[] {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same dimension");
    }

    // Normalizar pesos
    const totalWeight = weight1 + weight2;
    const normalizedWeight1 = weight1 / totalWeight;
    const normalizedWeight2 = weight2 / totalWeight;

    // Combinar embeddings
    const combined = embedding1.map(
      (val, index) =>
        val * normalizedWeight1 + embedding2[index] * normalizedWeight2
    );

    return combined;
  }

  /**
   * Analisa padrões de recomendação para um usuário
   */
  async analyzeUserRecommendationPatterns(
    userId: string,
    daysBack: number = 30
  ): Promise<{
    top_categories: Array<{ category: string; count: number }>;
    average_similarity_threshold: number;
    recommendation_frequency: number;
  }> {
    try {
      // Esta função pode ser expandida para análise mais profunda
      // Por enquanto, retorna dados básicos

      const userContext = await userEnhancedContextRepository.findByUserId(
        userId
      );
      if (!userContext) {
        throw new Error("User context not found");
      }

      // Buscar contextos similares para identificar padrões
      const similarContexts =
        await userEnhancedContextRepository.findSimilarContexts(
          userId,
          0.7,
          10
        );

      // Analisar categorias mais comuns baseadas em metadata
      const categories = new Map<string, number>();

      // Análise básica das categorias do contexto do usuário
      if (userContext.metadata.interests) {
        userContext.metadata.interests.forEach((interest: string) => {
          categories.set(interest, (categories.get(interest) || 0) + 1);
        });
      }

      const topCategories = Array.from(categories.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        top_categories: topCategories,
        average_similarity_threshold: 0.7, // Default, pode ser calculado baseado em histórico
        recommendation_frequency: similarContexts.length,
      };
    } catch (error) {
      console.error("Error analyzing user recommendation patterns:", error);
      throw new Error(`Failed to analyze patterns: ${error.message}`);
    }
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
