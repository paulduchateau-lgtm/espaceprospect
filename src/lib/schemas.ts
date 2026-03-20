import { tool } from 'ai';
import { z } from 'zod';

export const dashboardSchema = z.object({
  risks: z
    .array(
      z.object({
        id: z.string().describe("Identifiant unique du risque, ex: 'arret-travail'"),
        label: z
          .string()
          .describe("Nom du risque en francais, ex: 'Arret de travail prolonge'"),
        severity: z
          .enum(['high', 'medium', 'low'])
          .describe('Niveau de severite pour ce profil TNS'),
        description: z
          .string()
          .describe('Explication personnalisee du risque pour ce profil'),
      })
    )
    .describe('Risques identifies pour le profil TNS du prospect'),

  products: z
    .array(
      z.object({
        id: z.string().describe("Identifiant produit, ex: 'super-novaterm'"),
        name: z.string().describe('Nom commercial du produit MetLife'),
        relevance: z
          .string()
          .describe('Explication de pourquoi ce produit est pertinent pour ce prospect'),
        coverageType: z
          .string()
          .describe(
            'Type de couverture: prevoyance, emprunteur, deces, incapacite, invalidite'
          ),
        sourceIds: z
          .array(z.number())
          .describe('IDs des sources RAG utilisees pour cette recommandation'),
      })
    )
    .describe('Produits MetLife recommandes'),

  partners: z
    .array(
      z.object({
        id: z
          .enum(['caarl', 'doado', 'noctia'])
          .describe('Identifiant du service partenaire'),
        relevance: z
          .string()
          .describe('Pourquoi ce service est pertinent pour ce prospect'),
      })
    )
    .optional()
    .describe('Services partenaires pertinents'),

  resources: z
    .array(
      z.object({
        title: z.string().describe('Titre de la ressource'),
        url: z.string().describe('URL vers la page MetLife'),
        type: z
          .enum(['article', 'guide', 'tool', 'faq'])
          .describe('Type de ressource'),
      })
    )
    .optional()
    .describe('Ressources et articles pertinents'),

  profile: z
    .object({
      profession: z.string().describe('Profession du prospect'),
      sector: z.string().describe("Secteur d'activite"),
      concerns: z
        .array(z.string())
        .describe('Preoccupations principales identifiees'),
    })
    .describe('Profil extrait de la conversation'),
});

export type DashboardData = z.infer<typeof dashboardSchema>;

export const dashboardTool = tool({
  description:
    'Generate personalized dashboard data based on the TNS situation analysis',
  inputSchema: dashboardSchema,
  execute: async (input) => input,
});
