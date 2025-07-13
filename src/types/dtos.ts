import { z } from "zod";

// Solution Owner DTOs
export const CreateSolutionOwnerDto = z.object({
  company_title: z.string().min(1),
  url: z.string().optional(),
  company_description: z.string().optional(),
  metadata: z.record(z.any()),
});

export const UpdateSolutionOwnerDto = z.object({
  company_title: z.string().min(1).optional(),
  url: z.string().optional(),
  company_description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const SolutionOwnerResponseDto = z.object({
  id: z.string(),
  company_id: z.string(),
  company_name: z.string(),
  domain: z.string().nullable(),
  metadata: z.record(z.any()),
  output_base_prompt: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
});

// Solution Owner Products DTOs
export const CreateSolutionProductDto = z.object({
  owner_id: z.string(),
  metadata: z.record(z.any()),
  title: z.string(),
  categories: z.array(z.string()),
  description: z.string(),
  url: z.string(),
  image_url: z.string(),
});

//

export const UpdateSolutionProductDto = z.object({
  owner_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  output_base_prompt: z.record(z.any()).optional(),
});

export const SolutionProductResponseDto = z.object({
  id: z.string(),
  product_id: z.string(),
  owner_id: z.string().nullable(),
  metadata: z.record(z.any()),
  title: z.string(),
  categories: z.array(z.string()),
  description: z.string(),
  url: z.string(),
  image_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Chat History DTOs
export const ChatMessageDto = z.object({
  session_id: z.string(),
  message: z.record(z.any()),
  user_id: z.string().optional(),
});

export const ChatHistoryResponseDto = z.object({
  id: z.number(),
  user_id: z.string(),
  session_id: z.string(),
  message: z.record(z.any()),
});

// User Enhanced Context DTOs
export const OnboardingDto = z.object({
  user_id: z.string(),
  metadata: z.record(z.any()),
  output_base_prompt: z.record(z.any()),
});

export const UpdateUserContextDto = z.object({
  metadata: z.record(z.any()).optional(),
  output_base_prompt: z.record(z.any()).optional(),
});

export const UserEnhancedContextResponseDto = z.object({
  id: z.string(),
  context_id: z.string(),
  user_id: z.string(),
  metadata: z.record(z.any()),
  output_base_prompt: z.record(z.any()),
  embeddings: z.array(z.number()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Recommendation DTOs
export const RecommendationRequestDto = z.object({
  userEnhancedContext: z.object({
    id: z.string(),
    context_id: z.string(),
    user_id: z.string(),
    metadata: z.record(z.any()),
    output_base_prompt: z.record(z.any()),
    embeddings: z.array(z.number()).nullable(),
  }),
  threadSummary: z.string(),
  limit: z.number().min(1).max(50).default(10),
  similarity_threshold: z.number().min(0).max(1).default(0.7),
});

export const RecommendationResponseDto = z.object({
  product_id: z.string(),
  similarity_score: z.number(),
  metadata: z.record(z.any()),
  output_base_prompt: z.record(z.any()),
  owner_info: z.object({
    company_name: z.string(),
    domain: z.string().nullable(),
  }),
});

export const RecommendationListResponseDto = z.object({
  recommendations: z.array(RecommendationResponseDto),
  total: z.number(),
});

// Thread Summary DTOs
export const ThreadSummaryDto = z.object({
  session_id: z.string(),
  summary: z.string(),
  embeddings: z.array(z.number()),
  message_count: z.number(),
});

// Types
export type CreateSolutionOwnerInput = z.infer<typeof CreateSolutionOwnerDto>;
export type UpdateSolutionOwnerInput = z.infer<typeof UpdateSolutionOwnerDto>;
export type SolutionOwnerResponse = z.infer<typeof SolutionOwnerResponseDto>;

export type CreateSolutionProductInput = z.infer<
  typeof CreateSolutionProductDto
>;
export type UpdateSolutionProductInput = z.infer<
  typeof UpdateSolutionProductDto
>;
export type SolutionProductResponse = z.infer<
  typeof SolutionProductResponseDto
>;

export type ChatMessage = z.infer<typeof ChatMessageDto>;
export type ChatHistoryResponse = z.infer<typeof ChatHistoryResponseDto>;

export type OnboardingInput = z.infer<typeof OnboardingDto>;
export type UpdateUserContextInput = z.infer<typeof UpdateUserContextDto>;
export type UserEnhancedContextResponse = z.infer<
  typeof UserEnhancedContextResponseDto
>;

export type RecommendationRequest = z.infer<typeof RecommendationRequestDto>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseDto>;
export type RecommendationListResponse = z.infer<
  typeof RecommendationListResponseDto
>;

export type ThreadSummary = z.infer<typeof ThreadSummaryDto>;
