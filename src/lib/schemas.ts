import { z } from 'zod';
import { tool, zodSchema } from 'ai';

/**
 * Dashboard data schema for structured output extraction via Claude tool_use.
 * This schema defines the complete payload that Phase 4 will render as the dashboard.
 *
 * Claude is instructed to ALWAYS call generate_dashboard after its conversational response.
 * The tool uses pass-through execution (input === output) -- no side effects.
 */

export const riskSchema = z.object({
  id: z.string().describe("Unique risk identifier, e.g. 'work-stoppage'"),
  label: z
    .string()
    .describe("Risk name in English, e.g. 'Extended work stoppage'"),
  severity: z.enum(['high', 'medium', 'low']).describe('Severity level for this self-employed profile'),
  description: z
    .string()
    .describe('Personalized risk explanation for this profile'),
});

export const productSchema = z.object({
  id: z.string().describe("Product identifier, e.g. 'super-novaterm'"),
  name: z.string().describe('Commercial MetLife product name'),
  relevance: z
    .string()
    .describe(
      'Explanation of why this product is relevant for this prospect'
    ),
  coverageType: z
    .string()
    .describe(
      'Coverage type: income protection, loan, death, disability, invalidity'
    ),
  sourceIds: z
    .array(z.number())
    .describe('RAG source IDs used for this recommendation'),
});

export const partnerSchema = z.object({
  id: z
    .enum(['caarl', 'doado', 'noctia'])
    .describe('Partner service identifier'),
  relevance: z
    .string()
    .describe('Why this service is relevant for this prospect'),
});

export const resourceSchema = z.object({
  title: z.string().describe('Resource title'),
  url: z.string().describe('URL to the MetLife page'),
  type: z
    .enum(['article', 'guide', 'tool', 'faq'])
    .describe('Resource type'),
});

export const profileSchema = z.object({
  profession: z.string().describe('Prospect profession'),
  sector: z.string().describe('Business sector'),
  concerns: z
    .array(z.string())
    .describe('Main identified concerns'),
});

export const dashboardSchema = z.object({
  risks: z
    .array(riskSchema)
    .describe('Identified risks for the self-employed prospect profile'),
  products: z
    .array(productSchema)
    .describe('Recommended MetLife products'),
  partners: z
    .array(partnerSchema)
    .optional()
    .describe('Relevant partner services'),
  resources: z
    .array(resourceSchema)
    .optional()
    .describe('Relevant resources and articles'),
  profile: profileSchema.describe('Profile extracted from conversation'),
});

/**
 * Client-side product schema for dashboard rendering.
 * coverageType and sourceIds are optional (may not be present in SSE payload).
 */
export const clientProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  relevance: z.string(),
  url: z.string().optional(),
  coverageType: z.string().optional(),
  sourceIds: z.array(z.number()).optional(),
});

/**
 * Dashboard data schema for component-level validation (Phase 4).
 * Differs from dashboardSchema: partners/resources default to [] when omitted,
 * and product fields coverageType/sourceIds are optional.
 */
export const dashboardDataSchema = z.object({
  risks: z.array(riskSchema),
  products: z.array(clientProductSchema),
  partners: z.array(partnerSchema).optional().default([]),
  resources: z.array(resourceSchema).optional().default([]),
  profile: profileSchema,
});

export type DashboardDataInput = z.input<typeof dashboardDataSchema>;
export type DashboardDataOutput = z.output<typeof dashboardDataSchema>;

export type DashboardData = z.infer<typeof dashboardSchema>;
export type Risk = z.infer<typeof riskSchema>;
export type Product = z.infer<typeof productSchema>;
export type Partner = z.infer<typeof partnerSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Profile = z.infer<typeof profileSchema>;

/**
 * AI SDK tool definition for dashboard extraction.
 * Uses pass-through execution: Claude generates the structured data as tool input,
 * and execute() returns it as-is. No side effects, no DB writes (that's Phase 5).
 */
export const dashboardTool = tool({
  description:
    'Generate personalized dashboard data based on the TNS prospect situation analysis. MUST be called after every conversational response.',
  inputSchema: zodSchema(dashboardSchema),
  execute: async (input) => input,
});
