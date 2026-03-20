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
  id: z.string().describe("Identifiant unique du risque, ex: 'arret-travail'"),
  label: z
    .string()
    .describe("Nom du risque en francais, ex: 'Arret de travail prolonge'"),
  severity: z.enum(['high', 'medium', 'low']).describe('Niveau de severite pour ce profil TNS'),
  description: z
    .string()
    .describe('Explication personnalisee du risque pour ce profil'),
});

export const productSchema = z.object({
  id: z.string().describe("Identifiant produit, ex: 'super-novaterm'"),
  name: z.string().describe('Nom commercial du produit MetLife'),
  relevance: z
    .string()
    .describe(
      'Explication de pourquoi ce produit est pertinent pour ce prospect'
    ),
  coverageType: z
    .string()
    .describe(
      'Type de couverture: prevoyance, emprunteur, deces, incapacite, invalidite'
    ),
  sourceIds: z
    .array(z.number())
    .describe('IDs des sources RAG utilisees pour cette recommandation'),
});

export const partnerSchema = z.object({
  id: z
    .enum(['caarl', 'doado', 'noctia'])
    .describe('Identifiant du service partenaire'),
  relevance: z
    .string()
    .describe('Pourquoi ce service est pertinent pour ce prospect'),
});

export const resourceSchema = z.object({
  title: z.string().describe('Titre de la ressource'),
  url: z.string().describe('URL vers la page MetLife'),
  type: z
    .enum(['article', 'guide', 'tool', 'faq'])
    .describe('Type de ressource'),
});

export const profileSchema = z.object({
  profession: z.string().describe('Profession du prospect'),
  sector: z.string().describe("Secteur d'activite"),
  concerns: z
    .array(z.string())
    .describe('Preoccupations principales identifiees'),
});

export const dashboardSchema = z.object({
  risks: z
    .array(riskSchema)
    .describe('Risques identifies pour le profil TNS du prospect'),
  products: z
    .array(productSchema)
    .describe('Produits MetLife recommandes'),
  partners: z
    .array(partnerSchema)
    .optional()
    .describe('Services partenaires pertinents'),
  resources: z
    .array(resourceSchema)
    .optional()
    .describe('Ressources et articles pertinents'),
  profile: profileSchema.describe('Profil extrait de la conversation'),
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
