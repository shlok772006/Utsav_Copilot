import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { OpSchema } from '../domain/types';

// --- Prompt 1: Intake ---
export const IntakeOutputSchema = z.object({
  ops: z.array(OpSchema).default([]),
  date_hint: z.string().nullable().default(null),
  assistantMessage: z.string(),
  readyToPlan: z.boolean().default(false),
});
export type IntakeOutput = z.infer<typeof IntakeOutputSchema>;

// --- Prompt 2: Change Parser ---
export const ChangeOutputSchema = z.object({
  ops: z.array(OpSchema).default([]),
  clarification: z.string().nullable().default(null),
});
export type ChangeOutput = z.infer<typeof ChangeOutputSchema>;

// --- Prompt 3: Advisor ---
export const AdviseOptionSchema = z.object({
  scenarioId: z.string(),
  headline: z.string(),
  why: z.string(),
  tradeoff: z.string(),
});
export type AdviseOption = z.infer<typeof AdviseOptionSchema>;

export const AdviseOutputSchema = z.object({
  summary: z.string(),
  options: z.array(AdviseOptionSchema).default([]),
  recommendedScenarioId: z.string(),
});
export type AdviseOutput = z.infer<typeof AdviseOutputSchema>;

// --- Prompt 4: Concept Ideas ---
export const ConceptIdeaSchema = z.object({
  name: z.string(),
  vibe: z.string(),
  whereMoneyGoes: z.string(),
  costLevel: z.enum(['lower', 'similar', 'higher']),
  comfortNotes: z.string(),
  risks: z.string(),
  firstThreeSteps: z.array(z.string()).default([]),
});
export type ConceptIdea = z.infer<typeof ConceptIdeaSchema>;

export const IdeasOutputSchema = z.object({
  concepts: z.array(ConceptIdeaSchema).length(3),
});
export type IdeasOutput = z.infer<typeof IdeasOutputSchema>;

// --- Prompt 5: Vendor Quote Extraction ---
export const QuoteExtractionOutputSchema = z.object({
  vendorName: z.string().nullable().default(null),
  category: z.string(),
  totalPrice: z.number().nullable().default(null),
  unitPrice: z.number().nullable().default(null),
  unitLabel: z.string().nullable().default(null),
  guestsCovered: z.number().nullable().default(null),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  additionalCharges: z.array(z.string()).default([]),
  paymentTerms: z.string().nullable().default(null),
  validity: z.string().nullable().default(null),
  missing: z.array(z.string()).default([]),
  questionsToAsk: z.array(z.string()).default([]),
});
export type QuoteExtractionOutput = z.infer<typeof QuoteExtractionOutputSchema>;

/**
 * Converts any Zod schema to an OpenAPI / JSON Schema object
 * formatted for Gemini structured output.
 */
export function getJsonSchema(schema: z.ZodTypeAny, title = 'Output'): Record<string, unknown> {
  const targetSchema = schema as unknown as Parameters<typeof zodToJsonSchema>[0];
  const jsonSchema = zodToJsonSchema(targetSchema, title);
  return jsonSchema as Record<string, unknown>;
}
