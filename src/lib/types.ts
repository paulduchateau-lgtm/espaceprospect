export interface Risk {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  description: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  relevance: string;
  url?: string;
  coverageType?: string;
}

export interface PartnerRecommendation {
  id: "caarl" | "doado" | "noctia";
  relevance: string;
}

export interface Resource {
  title: string;
  url: string;
  type: "article" | "guide" | "tool" | "faq";
}

export interface ProspectProfile {
  profession: string;
  sector: string;
  concerns: string[];
}

export interface DashboardData {
  risks: Risk[];
  products: ProductRecommendation[];
  partners: PartnerRecommendation[];
  resources: Resource[];
  profile: ProspectProfile;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}
