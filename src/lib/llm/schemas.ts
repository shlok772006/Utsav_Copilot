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

const GEMINI_IGNORED_KEYS = new Set([
  '$schema',
  'additionalProperties',
  'default',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minimum',
  'maximum',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
]);

export function sanitizeGeminiSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }
  if (Array.isArray(schema)) {
    return schema.map(sanitizeGeminiSchema);
  }
  const obj = schema as Record<string, unknown>;

  // Handle top-level or nested $ref dereferencing
  if (obj.$ref && typeof obj.$ref === 'string') {
    const refPath = obj.$ref;
    const parts = refPath.replace(/^#\//, '').split('/');
    const defs = (obj.definitions || obj.$defs) as Record<string, unknown> | undefined;
    if (defs && parts.length === 2 && parts[0] === 'definitions' && defs[parts[1]]) {
      return sanitizeGeminiSchema(defs[parts[1]]);
    }
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (GEMINI_IGNORED_KEYS.has(k)) {
      continue;
    }
    if (k === 'definitions' || k === '$defs') {
      // Omit definitions block if not needed
      continue;
    }
    if (k === 'type' && Array.isArray(v)) {
      // Gemini OpenAPI schema requires type as string, and nullable: true
      const nonNull = v.find((t) => t !== 'null') || 'string';
      out['type'] = nonNull;
      if (v.includes('null')) {
        out['nullable'] = true;
      }
    } else if (k === 'const') {
      if (typeof v === 'string') {
        out['enum'] = [v];
      } else if (typeof v === 'number') {
        out['type'] = Number.isInteger(v) ? 'integer' : 'number';
      }
    } else {
      out[k] = sanitizeGeminiSchema(v);
    }
  }
  return out;
}

/**
 * Converts any Zod schema to an OpenAPI / JSON Schema object
 * formatted directly for Gemini structured output (no top-level $ref,
 * no unsupported protobuf keywords, and const converted to enum).
 */
export function getJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const zodWithToJson = z as unknown as { toJSONSchema?: (s: unknown) => Record<string, unknown> };
  let raw: Record<string, unknown>;
  if (typeof zodWithToJson.toJSONSchema === 'function') {
    raw = zodWithToJson.toJSONSchema(schema);
  } else {
    const targetSchema = schema as unknown as Parameters<typeof zodToJsonSchema>[0];
    const generated = zodToJsonSchema(targetSchema, { $refStrategy: 'none' }) as Record<string, unknown>;
    raw = generated;
  }

  // If raw still has top-level $ref, resolve it from definitions
  if (raw && typeof raw.$ref === 'string' && raw.definitions) {
    const defKey = raw.$ref.replace(/^#\/definitions\//, '');
    const defs = raw.definitions as Record<string, unknown>;
    if (defs[defKey]) {
      raw = defs[defKey] as Record<string, unknown>;
    }
  }

  return sanitizeGeminiSchema(raw) as Record<string, unknown>;
}
