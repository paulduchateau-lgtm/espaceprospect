"use client";

import { use, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  FileText,
  BookOpen,
  Wrench,
  HelpCircle,
  Phone,
  Scale,
  Activity,
  Moon,
  ChevronRight,
  ArrowLeft,
  User,
  Briefcase,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DashboardData, Risk, ProductRecommendation, PartnerRecommendation, Resource } from "@/lib/types";
import { partners } from "@/config/partners";
import { Disclaimer } from "@/components/legal/Disclaimer";
import { TrustSignals } from "@/components/legal/TrustSignals";

type LoadState = "loading" | "loaded" | "not-found" | "error";

function ProspectCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 bg-white/15 px-3 py-2 rounded-lg">
      <span className="text-xs text-white/70">Code d&apos;accès</span>
      <span className="font-mono text-base font-bold text-white tracking-widest">
        {code}
      </span>
      <button
        onClick={copy}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-white/20 transition-colors"
        aria-label="Copier le code"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[#A4CE4E]" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-white/70" />
        )}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Dashboard header
// ──────────────────────────────────────────────
function DashboardHeader({ profession }: { profession: string }) {
  return (
    <header className="bg-white border-b border-[#D9D9D6] sticky top-0 z-30">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-[#75787B] hover:text-[#1A1A1A] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">metlife.fr</span>
          </a>
          <div className="w-px h-5 bg-[#D9D9D6]" />
          <img src="/metlife-logo.png" alt="MetLife" className="h-7" />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-[#75787B]">
            <User className="h-4 w-4" />
            {profession}
          </div>
          <button
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-md transition-colors hover:brightness-95"
            style={{ background: "#A4CE4E", color: "#1A1A1A" }}
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Contacter un conseiller</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────
// Profile summary bar
// ──────────────────────────────────────────────
function ProfileBar({ data, code }: { data: DashboardData; code: string | null }) {
  return (
    <div className="bg-gradient-to-r from-[#0061A0] to-[#0090DA] text-white">
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="text-sm text-white/70 mb-1">Votre espace personnalisé</p>
            <h1 className="text-2xl font-bold">{data.profile.profession}</h1>
          </div>
          {code && <ProspectCodeBadge code={code} />}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-full">
            <Briefcase className="h-3 w-3" />
            {data.profile.sector}
          </span>
          {data.profile.concerns.map((concern) => (
            <span
              key={concern}
              className="text-xs bg-white/10 px-3 py-1.5 rounded-full"
            >
              {concern}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Risks section — NO cards, uses list with colored indicators
// ──────────────────────────────────────────────
const severityConfig = {
  high: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Risque élevé",
    Icon: ShieldAlert,
    dotColor: "bg-red-500",
  },
  medium: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Risque modéré",
    Icon: Shield,
    dotColor: "bg-amber-500",
  },
  low: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Risque faible",
    Icon: ShieldCheck,
    dotColor: "bg-green-500",
  },
};

function RisksList({ risks }: { risks: Risk[] }) {
  const sorted = [...risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="divide-y divide-[#E5E5E5]">
      {sorted.map((risk) => {
        const config = severityConfig[risk.severity];
        return (
          <div key={risk.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${config.bg}`}
              >
                <config.Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">
                    {risk.label}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${config.color} ${config.border} ${config.bg}`}
                  >
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-[#75787B] leading-relaxed">
                  {risk.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Products section — cards are OK here (clickable links)
// ──────────────────────────────────────────────
function ProductsList({ products }: { products: ProductRecommendation[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-xl border border-[#D9D9D6] p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0090DA]/7 shrink-0">
              <ShieldCheck className="h-5 w-5 text-[#0090DA]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  {product.name}
                </h4>
                {product.coverageType && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {product.coverageType}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-[#75787B] leading-relaxed mb-3">
            {product.relevance}
          </p>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0090DA] hover:underline"
            >
              En savoir plus
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Partners — simple horizontal list, no cards
// ──────────────────────────────────────────────
const partnerIcons = {
  caarl: Scale,
  doado: Activity,
  noctia: Moon,
} as const;

function PartnersList({
  partnerRecs,
}: {
  partnerRecs: PartnerRecommendation[];
}) {
  return (
    <div className="divide-y divide-[#E5E5E5]">
      {partnerRecs.map((p) => {
        const config = partners[p.id];
        const Icon = partnerIcons[p.id];
        return (
          <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0090DA]/7 shrink-0">
              <Icon className="h-4 w-4 text-[#0090DA]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {config.name}{" "}
                <span className="font-normal text-[#75787B]">
                  — {config.tagline}
                </span>
              </p>
              <p className="text-sm text-[#75787B] mt-0.5">{p.relevance}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Resources — already list-based, keep as clickable items
// ──────────────────────────────────────────────
const typeConfig = {
  article: { label: "Article", Icon: FileText },
  guide: { label: "Guide", Icon: BookOpen },
  tool: { label: "Outil", Icon: Wrench },
  faq: { label: "FAQ", Icon: HelpCircle },
} as const;

function ResourcesList({ resources }: { resources: Resource[] }) {
  return (
    <div className="space-y-2">
      {resources.map((resource, index) => {
        const config = typeConfig[resource.type];
        return (
          <a
            key={`${resource.url}-${index}`}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 transition-colors hover:bg-[#F7F7F7] hover:border-[#D9D9D6]"
          >
            <config.Icon className="h-4 w-4 text-[#75787B] shrink-0" />
            <span className="flex-1 text-sm font-medium text-[#1A1A1A]">
              {resource.title}
            </span>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {config.label}
            </Badge>
            <ExternalLink className="h-3 w-3 text-[#A7A8AA] shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Advisor CTA section
// ──────────────────────────────────────────────
function AdvisorSection() {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(0,97,160,0.04), rgba(164,206,78,0.06))",
        border: "1px solid #E5E5E5",
      }}
    >
      <Phone className="h-8 w-8 text-[#0090DA] mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
        Vous souhaitez aller plus loin ?
      </h3>
      <p className="text-sm text-[#75787B] mb-4">
        Un conseiller MetLife spécialisé TNS peut affiner ces recommandations et
        vous proposer un devis personnalisé.
      </p>
      <button
        className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-md transition-colors hover:brightness-95"
        style={{ background: "#A4CE4E", color: "#1A1A1A" }}
      >
        <Phone className="h-4 w-4" />
        Prendre rendez-vous
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Dashboard content
// ──────────────────────────────────────────────
function DashboardContent({ data, code }: { data: DashboardData; code: string | null }) {
  return (
    <>
      <ProfileBar data={data} code={code} />

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column — 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Risks */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-[#75787B]" />
                <h2 className="text-lg font-bold text-[#1A1A1A]">
                  Risques identifiés
                </h2>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-5">
                <RisksList risks={data.risks} />
              </div>
            </motion.section>

            {/* Products */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-[#0090DA]" />
                <h2 className="text-lg font-bold text-[#1A1A1A]">
                  Solutions MetLife recommandées
                </h2>
              </div>
              <ProductsList products={data.products} />
            </motion.section>

            {/* Resources */}
            {data.resources.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-[#75787B]" />
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Ressources utiles
                  </h2>
                </div>
                <ResourcesList resources={data.resources} />
              </motion.section>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-6">
            {/* Partners */}
            {data.partners.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 uppercase tracking-wide">
                  Services partenaires
                </h3>
                <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
                  <PartnersList partnerRecs={data.partners} />
                </div>
              </motion.section>
            )}

            {/* CTA */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <AdvisorSection />
            </motion.section>

            {/* Legal */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="space-y-4"
            >
              <Disclaimer />
              <TrustSignals />
            </motion.section>
          </div>
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Loading skeleton
// ──────────────────────────────────────────────
function DashboardLoadingSkeleton() {
  return (
    <>
      {/* Header skeleton */}
      <div className="bg-white border-b border-[#D9D9D6] h-16" />
      {/* Profile bar skeleton */}
      <div className="bg-gradient-to-r from-[#0061A0] to-[#0090DA] py-8 px-6">
        <div className="max-w-[1100px] mx-auto animate-pulse">
          <div className="h-4 w-32 bg-white/20 rounded mb-2" />
          <div className="h-7 w-64 bg-white/20 rounded mb-4" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-white/10 rounded-full" />
            <div className="h-6 w-28 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto px-6 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-5 w-40 bg-[#E5E5E5] rounded" />
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-[#F2F2F2] rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-[#F2F2F2] rounded" />
                    <div className="h-3 w-full bg-[#F2F2F2] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-[#F2F2F2] rounded-xl" />
            <div className="h-40 bg-[#F2F2F2] rounded-xl" />
          </div>
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────
export default function EspacePage({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = use(params);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [profession, setProfession] = useState("");
  const [prospectCode, setProspectCode] = useState<string | null>(null);

  useEffect(() => {
    // Demo mode: read dashboard from sessionStorage
    if (prospectId === "demo") {
      try {
        const stored = sessionStorage.getItem("demo-dashboard");
        if (stored) {
          const data = JSON.parse(stored);
          setDashboardData(data);
          setProfession(data?.profile?.profession || "TNS");
          setLoadState("loaded");
          return;
        }
      } catch {}
      setLoadState("not-found");
      return;
    }

    fetch(`/api/prospect/${prospectId}`)
      .then((res) => {
        if (res.status === 404) {
          setLoadState("not-found");
          return null;
        }
        if (!res.ok) {
          setLoadState("error");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setDashboardData(data.dashboard || null);
        setProfession(data.dashboard?.profile?.profession || "TNS");
        setProspectCode(data.code ?? null);
        setLoadState("loaded");
      })
      .catch(() => {
        setLoadState("error");
      });
  }, [prospectId]);

  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <DashboardLoadingSkeleton />
      </div>
    );
  }

  if (loadState === "not-found") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
        <h1 className="text-xl font-semibold">Espace introuvable</h1>
        <p className="text-sm text-[#75787B] text-center">
          Cet espace n&apos;existe pas ou a été supprimé.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#0090DA] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au site MetLife
        </a>
      </div>
    );
  }

  if (loadState === "error" || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
        <h1 className="text-xl font-semibold">Erreur de chargement</h1>
        <p className="text-sm text-[#75787B] text-center">
          Impossible de charger votre espace. Veuillez réessayer.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#0090DA] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au site MetLife
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <DashboardHeader profession={profession} />
      <DashboardContent data={dashboardData} code={prospectCode} />
    </div>
  );
}
