import { z } from 'zod';

// --- Occasion ---
export const OccasionSchema = z.enum([
  'wedding',
  'reception',
  'sangeet',
  'anniversary',
  'birthday',
  'engagement',
  'general',
]);
export type Occasion = z.infer<typeof OccasionSchema>;

// --- Expense Categories ---
export const CoreCategorySchema = z.enum([
  'venue',
  'catering',
  'decor',
  'photography',
  'attire',
  'entertainment',
  'invitations_misc',
  'logistics',
]);
export type CoreCategory = z.infer<typeof CoreCategorySchema>;

export const CategorySchema = z.enum([
  'venue',
  'catering',
  'decor',
  'photography',
  'attire',
  'entertainment',
  'invitations_misc',
  'logistics',
  'contingency',
]);
export type Category = z.infer<typeof CategorySchema>;

// --- Provenance ---
export const ProvenanceSchema = z.enum([
  'user',
  'derived',
  'heuristic',
  'ai',
  'vendor',
]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

// --- Priority Levels ---
export const PriorityLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

// --- Constraints ---
export const ConstraintsSchema = z.object({
  dietary: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  cultural: z.array(z.string()).default([]),
  other: z.array(z.string()).default([]),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

// --- Event State ---
export const EventStateSchema = z.object({
  occasion: OccasionSchema.optional(),
  totalBudget: z.number().positive().optional(),
  guestCount: z.number().int().positive().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  city: z.string().optional(),
  priorities: z.record(CoreCategorySchema, PriorityLevelSchema).default({
    venue: 3,
    catering: 3,
    decor: 3,
    photography: 3,
    attire: 3,
    entertainment: 3,
    invitations_misc: 3,
    logistics: 3,
  }),
  lockedCategories: z.array(CoreCategorySchema).default([]),
  lockedBudgetLines: z.record(CoreCategorySchema, z.number().int().nonnegative()).default(
    {} as Record<CoreCategory, number>
  ),
  constraints: ConstraintsSchema.default({
    dietary: [],
    accessibility: [],
    cultural: [],
    other: [],
  }),
  completedTasks: z.array(z.string()).default([]),
});
export type EventState = z.infer<typeof EventStateSchema>;

// --- Budget Line ---
export const BudgetLineSchema = z.object({
  category: CategorySchema,
  share: z.number().min(0).max(1),
  amount: z.number().int().nonnegative(),
  perGuest: z.number().int().nonnegative().optional(),
  provenance: ProvenanceSchema,
});
export type BudgetLine = z.infer<typeof BudgetLineSchema>;

// --- Task & Timeline ---
export const TaskStatusSchema = z.enum([
  'ready',
  'blocked',
  'done',
  'overdue',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: CategorySchema,
  dependsOn: z.array(z.string()),
  durationDays: z.number().int().positive(),
  optional: z.boolean().default(false),
  occasions: z.array(OccasionSchema).optional(),
});
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: CategorySchema,
  dependsOn: z.array(z.string()),
  durationDays: z.number().int().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  latestStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: TaskStatusSchema,
  optional: z.boolean().default(false),
  provenance: ProvenanceSchema.default('heuristic'),
});
export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;

// --- Warnings ---
export const WarningCodeSchema = z.enum([
  'MISSING_REQUIRED',
  'LOW_PER_GUEST_CATERING',
  'HIGH_PER_HEAD_VENUE',
  'COMPRESSED_SCHEDULE',
  'OVERDUE_TASK',
  'OVER_BUDGET_QUOTE',
]);
export type WarningCode = z.infer<typeof WarningCodeSchema>;

export const WarningSeveritySchema = z.enum([
  'info',
  'warn',
  'critical',
]);
export type WarningSeverity = z.infer<typeof WarningSeveritySchema>;

export const WarningSchema = z.object({
  code: WarningCodeSchema,
  severity: WarningSeveritySchema,
  message: z.string(),
  related: z.array(z.string()).optional(),
});
export type Warning = z.infer<typeof WarningSchema>;

// --- Plan ---
export const PlanSchema = z.object({
  state: EventStateSchema,
  budget: z.array(BudgetLineSchema),
  tasks: z.array(ScheduledTaskSchema),
  warnings: z.array(WarningSchema),
  daysAvailable: z.number(),
  criticalPathDays: z.number(),
  compressed: z.boolean(),
});
export type Plan = z.infer<typeof PlanSchema>;

// --- Operations (Discriminated Union) ---
export const OpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('set_budget'), value: z.number() }),
  z.object({ op: z.literal('scale_budget'), factor: z.number() }),
  z.object({ op: z.literal('set_guest_count'), value: z.number() }),
  z.object({ op: z.literal('scale_guest_count'), factor: z.number() }),
  z.object({ op: z.literal('set_date'), value: z.string() }),
  z.object({ op: z.literal('shift_date_days'), days: z.number() }),
  z.object({ op: z.literal('set_priority'), category: CoreCategorySchema, level: PriorityLevelSchema }),
  z.object({ op: z.literal('lock_category'), category: CoreCategorySchema }),
  z.object({ op: z.literal('unlock_category'), category: CoreCategorySchema }),
  z.object({ op: z.literal('add_constraint'), kind: z.enum(['dietary', 'accessibility', 'cultural', 'other']), value: z.string() }),
  z.object({ op: z.literal('remove_constraint'), kind: z.enum(['dietary', 'accessibility', 'cultural', 'other']), value: z.string() }),
  z.object({ op: z.literal('complete_task'), taskId: z.string() }),
]);
export type Op = z.infer<typeof OpSchema>;

export interface RejectedOp {
  op: Op;
  reason: string;
}

// --- Plan Diff ---
export const CategoryDiffSchema = z.object({
  category: CategorySchema,
  previousAmount: z.number(),
  currentAmount: z.number(),
  deltaAmount: z.number(),
  previousShare: z.number(),
  currentShare: z.number(),
  deltaShare: z.number(),
});
export type CategoryDiff = z.infer<typeof CategoryDiffSchema>;

export const TaskDiffSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  previousDeadline: z.string(),
  currentDeadline: z.string(),
  daysShifted: z.number(),
});
export type TaskDiff = z.infer<typeof TaskDiffSchema>;

export const PlanDiffSchema = z.object({
  budgetDeltas: z.array(CategoryDiffSchema),
  shiftedTasks: z.array(TaskDiffSchema),
  statusChanges: z.array(
    z.object({
      taskId: z.string(),
      from: TaskStatusSchema,
      to: TaskStatusSchema,
    })
  ),
  addedWarnings: z.array(WarningSchema),
  resolvedWarnings: z.array(WarningSchema),
});
export type PlanDiff = z.infer<typeof PlanDiffSchema>;

// --- Scenario ---
export const ScenarioSchema = z.object({
  id: z.string(),
  headline: z.string(),
  why: z.string(),
  ops: z.array(OpSchema),
  tradeoff: z.string(),
  savingsAmount: z.number().optional(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

// --- Vendor Quote ---
export const RawQuoteSchema = z.object({
  category: CoreCategorySchema,
  vendorName: z.string().optional(),
  totalPrice: z.number().optional(),
  unitPrice: z.number().optional(),
  unitType: z.enum(['per_guest', 'per_plate', 'per_day', 'fixed']).optional(),
  coverageCount: z.number().optional(),
  includesTax: z.boolean().optional(),
  taxRate: z.number().optional(),
  rawText: z.string().optional(),
});
export type RawQuote = z.infer<typeof RawQuoteSchema>;

export const NormalizedQuoteSchema = z.object({
  category: CoreCategorySchema,
  vendorName: z.string(),
  totalPrice: z.number().nullable(),
  perGuest: z.number().nullable(),
  vsBudgetLine: z.number().nullable(),
  isOverBudget: z.boolean(),
  missingFields: z.array(z.string()),
  warnings: z.array(WarningSchema),
});
export type NormalizedQuote = z.infer<typeof NormalizedQuoteSchema>;
