import { z } from "zod";

export const suggestionTypeSchema = z.enum([
  "core_opinion",
  "main_thread",
  "target_reader",
  "writing_angle",
  "outline_patch",
  "reference"
]);

export const suggestionCardSchema = z.object({
  id: z.string().min(1),
  type: suggestionTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  applyPayload: z.record(z.string(), z.unknown()).default({})
});

const modelSuggestionCardSchema = suggestionCardSchema.extend({
  id: z.string().min(1).optional()
});

export const chatResponseSchema = z.object({
  assistantMessage: z.string().min(1),
  suggestions: z.array(suggestionCardSchema).default([])
});

export const modelChatResponseSchema = z.object({
  assistantMessage: z.string().min(1),
  suggestions: z.array(modelSuggestionCardSchema).default([])
});

export const thoughtBoardSchema = z.object({
  topic: z.string(),
  mainNewsId: z.string().optional(),
  supportingNewsIds: z.array(z.string()).default([]),
  targetReader: z.string(),
  writingAngle: z.string(),
  stance: z.string(),
  coreIdea: z.string(),
  supportReasons: z.array(z.string()).default([]),
  titles: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([])
});

export const thoughtBoardResponseSchema = z.object({
  thoughtBoard: thoughtBoardSchema
});

export const outlineSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  purpose: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  relatedNewsIds: z.array(z.string()).default([]),
  aiAdvice: z.string().min(1),
  locked: z.boolean()
});

export const outlineSchema = z.object({
  recommendedTitle: z.string().min(1),
  intro: z.string().min(1),
  sections: z.array(outlineSectionSchema).min(1),
  ending: z.string().min(1),
  readerTakeaway: z.string().min(1),
  version: z.number().int().nonnegative(),
  updatedAt: z.string().min(1)
});

export const modelOutlineSectionSchema = z.object({
  id: z.string().min(1).optional(),
  sectionTitle: z.string().min(1),
  sectionGoal: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  relatedNewsIds: z.array(z.string()).default([]),
  writingTips: z.string().min(1),
  locked: z.boolean().default(false)
});

export const modelOutlineResponseSchema = z.object({
  outline: z.object({
    recommendedTitle: z.string().min(1),
    intro: z.string().min(1),
    sections: z.array(modelOutlineSectionSchema).min(1),
    ending: z.string().min(1),
    readerTakeaway: z.string().min(1)
  }),
  changeSummary: z.string().min(1)
});

export const articleBlockTypeSchema = z.enum([
  "title",
  "intro",
  "heading",
  "paragraph",
  "quote",
  "list",
  "conclusion",
  "cta"
]);

export const articleBlockStatusSchema = z.enum(["empty", "generated", "edited"]);

export const articleBlockSchema = z.object({
  id: z.string().min(1),
  outlineSectionId: z.string().min(1),
  type: articleBlockTypeSchema,
  content: z.string(),
  status: articleBlockStatusSchema,
  locked: z.boolean(),
  updatedAt: z.string().min(1)
});

export const styleTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  paragraphStyle: z.string().min(1),
  headingStyle: z.string().min(1),
  quoteStyle: z.string().min(1),
  dividerStyle: z.string().min(1)
});

export const articleDraftSchema = z.object({
  outlineId: z.string().min(1),
  blocks: z.array(articleBlockSchema),
  selectedTemplateId: z.string().min(1),
  activeSectionId: z.string().optional(),
  status: z.enum(["empty", "partial", "generated", "edited", "exported"]),
  updatedAt: z.string().min(1)
});

export const generateSectionResponseSchema = z.object({
  blocks: z.array(articleBlockSchema).min(1)
});

export const rewriteBlockResponseSchema = z.object({
  block: articleBlockSchema
});

export const generateDraftResponseSchema = z.object({
  blocks: z.array(articleBlockSchema).min(1)
});

export type ApiSuggestion = z.infer<typeof suggestionCardSchema>;
export type ChatAIResponse = z.infer<typeof chatResponseSchema>;
export type OptimizeOutlineResponse = z.infer<typeof modelOutlineResponseSchema>;
export type GenerateSectionResponse = z.infer<typeof generateSectionResponseSchema>;
export type RewriteBlockResponse = z.infer<typeof rewriteBlockResponseSchema>;
export type GenerateDraftResponse = z.infer<typeof generateDraftResponseSchema>;
