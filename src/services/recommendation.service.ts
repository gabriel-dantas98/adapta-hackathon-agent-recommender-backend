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
    const methodName = "generateRecommendations";
    console.log(
      `[${new Date().toISOString()}] [RecommendationService.${methodName}] Starting with request:`,
      JSON.stringify(request, null, 2)
    );

    try {
      const {
        userEnhancedContext,
        threadSummary,
        limit = 10,
        similarity_threshold = 0.7,
      } = request;

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Processing with limit: ${limit}, threshold: ${similarity_threshold}`
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] userEnhancedContext: ${JSON.stringify(
          userEnhancedContext
        )}`
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] threadSummary: ${JSON.stringify(
          threadSummary
        )}`
      );

      if (!userEnhancedContext.embeddings || !threadSummary) {
        console.error(
          `[${new Date().toISOString()}] [RecommendationService.${methodName}] Missing embeddings or thread summary`
        );
        throw new Error("No embeddings available for recommendation");
      }

      const userEnhancedContextEmbeddings = userEnhancedContext.embeddings;
      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] User context embeddings dimension: ${
          userEnhancedContextEmbeddings.length
        }`
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Generating thread summary embedding`
      );
      const threadSummaryEmbedding = await embeddingsService.generateEmbedding(
        threadSummary
      );
      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Thread summary embedding dimension: ${
          threadSummaryEmbedding.length
        }`
      );

      let searchEmbedding: number[];

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Combining embeddings with weights: 70% user context, 30% thread summary`
      );
      // Combinar embeddings com peso (70% contexto usuário, 30% thread atual)
      searchEmbedding = this.combineEmbeddings(
        userEnhancedContextEmbeddings,
        threadSummaryEmbedding,
        0.7,
        0.3
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Searching for similar products`
      );
      // 4. Buscar produtos usando a coluna de embeddings dos produtos
      const similarProducts = await solutionProductRepository.findWithOwnerInfo(
        userEnhancedContextEmbeddings,
        threadSummaryEmbedding,
        0.75,
        0.25,
        limit
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Found ${
          similarProducts.length
        } similar products`
      );

      // 5. Mapear produtos para o formato de recomendação
      const recommendations = similarProducts.map((product) => ({
        product_id: product.product_id,
        similarity_score: product.similarity_score,
        metadata: product.metadata,
        output_base_prompt: {}, // Produtos não têm output_base_prompt
        owner_info: {
          company_name: product.owner_info.company_name,
          domain: product.owner_info.domain,
        },
      }));

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Mapped ${
          recommendations.length
        } recommendations`
      );

      const result = {
        recommendations,
        total: recommendations.length,
      };

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Successfully generated recommendations`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(`Failed to generate recommendations: ${String(error)}`);
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
    const methodName = "searchProductsByText";
    console.log(
      `[${new Date().toISOString()}] [RecommendationService.${methodName}] Starting with query: "${query}", limit: ${limit}, threshold: ${similarity_threshold}`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Generating embedding for search query`
      );
      // Gerar embedding para a query
      const queryEmbedding = await embeddingsService.generateEmbedding(query);
      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Query embedding dimension: ${
          queryEmbedding.length
        }`
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Searching for similar products with query embedding`
      );
      // Buscar produtos similares - usa o embedding da query tanto para user quanto thread
      const similarProducts = await solutionProductRepository.findWithOwnerInfo(
        queryEmbedding,
        queryEmbedding,
        0.5,
        0.5,
        limit
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Found ${
          similarProducts.length
        } similar products`
      );

      const recommendations = similarProducts.map((product) => ({
        product_id: product.product_id,
        similarity_score: product.similarity_score,
        metadata: product.metadata,
        output_base_prompt: {},
        owner_info: {
          company_name: product.owner_info.company_name,
          domain: product.owner_info.domain,
        },
      }));

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Mapped ${
          recommendations.length
        } recommendations`
      );

      const result = {
        recommendations,
        total: recommendations.length,
        user_context_summary: `Search results for: "${query}"`,
      };

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Successfully completed text search`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(`Failed to search products: ${String(error)}`);
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
    const methodName = "findSimilarProducts";
    console.log(
      `[${new Date().toISOString()}] [RecommendationService.${methodName}] Starting with productId: ${productId}, limit: ${limit}, threshold: ${similarity_threshold}`
    );

    try {
      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Searching for reference product`
      );
      // Buscar o produto de referência
      const referenceProduct = await solutionProductRepository.findByProductId(
        productId
      );

      if (!referenceProduct) {
        console.error(
          `[${new Date().toISOString()}] [RecommendationService.${methodName}] Reference product not found: ${productId}`
        );
        throw new Error("Reference product not found");
      }

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Found reference product: ${
          referenceProduct.title
        }`
      );

      // Usar embedding do produto de referência para ambos os parâmetros
      const mockEmbedding = new Array(1536).fill(0);
      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Using mock embedding for similar product search`
      );

      // Buscar produtos similares (usando mock embedding - precisa ser adaptado para usar o embedding real)
      const similarProducts = await solutionProductRepository.findWithOwnerInfo(
        mockEmbedding,
        mockEmbedding,
        0.5,
        0.5,
        limit + 1 // +1 para excluir o próprio produto
      );

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Found ${
          similarProducts.length
        } similar products (including reference)`
      );

      // Remover o produto de referência dos resultados
      const filteredProducts = similarProducts
        .filter((product) => product.product_id !== productId)
        .slice(0, limit);

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Filtered to ${
          filteredProducts.length
        } similar products (excluding reference)`
      );

      const recommendations = filteredProducts.map((product) => ({
        product_id: product.product_id,
        similarity_score: product.similarity_score,
        metadata: product.metadata,
        output_base_prompt: {},
        owner_info: {
          company_name: product.owner_info.company_name,
          domain: product.owner_info.domain,
        },
      }));

      const result = {
        recommendations,
        total: recommendations.length,
        user_context_summary: `Products similar to ${
          referenceProduct.metadata.name || productId
        }`,
      };

      console.log(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Successfully found similar products`
      );
      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Error occurred:`,
        error
      );
      throw new Error(`Failed to find similar products: ${String(error)}`);
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
    const methodName = "combineEmbeddings";
    console.log(
      `[${new Date().toISOString()}] [RecommendationService.${methodName}] Starting with embeddings: ${
        embedding1.length
      }d and ${embedding2.length}d, weights: ${weight1} and ${weight2}`
    );

    if (embedding1.length !== embedding2.length) {
      console.error(
        `[${new Date().toISOString()}] [RecommendationService.${methodName}] Embedding dimension mismatch: ${
          embedding1.length
        } vs ${embedding2.length}`
      );
      throw new Error("Embeddings must have the same dimension");
    }

    // Normalizar pesos
    const totalWeight = weight1 + weight2;
    const normalizedWeight1 = weight1 / totalWeight;
    const normalizedWeight2 = weight2 / totalWeight;

    console.log(
      `[${new Date().toISOString()}] [RecommendationService.${methodName}] Normalized weights: ${normalizedWeight1} and ${normalizedWeight2}`
    );

    // Combinar embeddings
    const combined = embedding1.map(
      (val, index) =>
        val * normalizedWeight1 + embedding2[index] * normalizedWeight2
    );

    console.log(
      `[${new Date().toISOString()}] [RecommendationService.${methodName}] Successfully combined embeddings`
    );
    return combined;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
