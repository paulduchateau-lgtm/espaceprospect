"use client"

import { useState } from "react"
import {
  ArrowUp,
  ArrowDown,
  Minus,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Info,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ComparisonResult, ComparisonRow } from "@/lib/guarantee-types"

const verdictConfig = {
  better: {
    icon: ArrowUp,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Mieux",
  },
  equal: {
    icon: Minus,
    color: "text-[#75787B]",
    bg: "bg-gray-50",
    label: "Égal",
  },
  worse: {
    icon: ArrowDown,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Moins bien",
  },
  not_comparable: {
    icon: HelpCircle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "N/C",
  },
  missing_info: {
    icon: HelpCircle,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "Manquant",
  },
} as const

const categoryLabels: Record<string, string> = {
  hospitalisation: "Hospitalisation",
  soins_courants: "Soins courants",
  optique: "Optique",
  dentaire: "Dentaire",
  medecine_douce: "Médecine douce",
  prevention: "Prévention",
  itt: "Arrêt de travail (ITT)",
  invalidite: "Invalidité",
  deces: "Décès",
  frais_generaux: "Frais généraux",
  services: "Services inclus",
  fiscal: "Avantages fiscaux",
}

function VerdictBadge({ verdict }: { verdict: ComparisonRow["verdict"] }) {
  const config = verdictConfig[verdict]
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${config.color} ${config.bg}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

function CategoryGroup({
  category,
  rows,
}: {
  category: string
  rows: ComparisonRow[]
}) {
  const [expanded, setExpanded] = useState(true)
  const label = categoryLabels[category] || category
  const betterCount = rows.filter((r) => r.verdict === "better").length
  const worseCount = rows.filter((r) => r.verdict === "worse").length

  return (
    <div className="border-b border-[#E5E5E5] last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] hover:bg-[#F2F2F2] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
          <span className="text-xs text-[#75787B]">
            {rows.length} garantie{rows.length > 1 ? "s" : ""}
          </span>
          {betterCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] text-green-600 border-green-200 bg-green-50"
            >
              +{betterCount}
            </Badge>
          )}
          {worseCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] text-red-500 border-red-200 bg-red-50"
            >
              -{worseCount}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#A7A8AA]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#A7A8AA]" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-[#F2F2F2]">
          {rows.map((row, i) => (
            <div
              key={`${row.category}-${row.label}-${i}`}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 items-center text-xs"
            >
              <span className="text-[#1A1A1A] font-medium pr-2">
                {row.label}
              </span>
              <span className="text-[#75787B] text-center">
                {row.current_value}
              </span>
              <span className="text-center text-[#1A1A1A]">
                {row.metlife_essentiel}
              </span>
              <span className="text-center font-medium text-[#1A1A1A]">
                {row.metlife_premium}
              </span>
              <div className="flex justify-end">
                <VerdictBadge verdict={row.verdict} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ComparisonTableProps {
  data: ComparisonResult
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  const grouped = data.rows.reduce<Record<string, ComparisonRow[]>>(
    (acc, row) => {
      const key = row.category
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    },
    {}
  )

  const betterTotal = data.rows.filter((r) => r.verdict === "better").length
  const worseTotal = data.rows.filter((r) => r.verdict === "worse").length
  const equalTotal = data.rows.filter((r) => r.verdict === "equal").length
  const missingTotal = data.rows.filter((r) => r.verdict === "missing_info").length

  const isPrevoyance = data.document_type === "prevoyance"
  const headers = data.column_headers ?? {
    current: "Votre contrat",
    col2: isPrevoyance ? "Régime Obligatoire" : "Essentiel",
    col3: isPrevoyance ? "RO + MetLife" : "Premium",
  }

  const categoryOrder = isPrevoyance
    ? ["itt", "invalidite", "deces", "frais_generaux", "services", "fiscal"]
    : ["hospitalisation", "soins_courants", "optique", "dentaire", "medecine_douce", "prevention"]

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
              (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  )

  const title = isPrevoyance ? "Comparatif de prévoyance" : "Comparatif de garanties"

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-[#0090DA]" />
          <h3 className="text-base font-semibold text-[#1A1A1A]">
            {title}
          </h3>
        </div>
        <p className="text-sm text-[#75787B]">
          {data.current_contract.insurer} {data.current_contract.product_name}
          {data.current_contract.monthly_price && (
            <> — {data.current_contract.monthly_price}</>
          )}
          {" "}vs MetLife
        </p>

        {/* Score summary */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <ArrowUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{betterTotal} meilleures</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="h-4 w-4 text-[#75787B]" />
            <span className="text-sm text-[#75787B]">{equalTotal} égales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDown className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{worseTotal} inférieures</span>
          </div>
          {missingTotal > 0 && (
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">{missingTotal} manquantes</span>
            </div>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 bg-[#F7F7F7] border-b border-[#E5E5E5] text-[10px] font-semibold uppercase tracking-wide text-[#75787B]">
        <span>Garantie</span>
        <span className="text-center">{headers.current}</span>
        <span className="text-center">{headers.col2}</span>
        <span className="text-center">{headers.col3}</span>
        <span className="text-right w-16">Verdict</span>
      </div>

      {/* Category groups */}
      {sortedCategories.map((category) => (
        <CategoryGroup
          key={category}
          category={category}
          rows={grouped[category]}
        />
      ))}

      {/* Summary */}
      <div className="p-5 bg-gradient-to-r from-[#0090DA]/5 to-transparent border-t border-[#E5E5E5]">
        <div className="flex items-start gap-2 mb-3">
          <Info className="h-4 w-4 text-[#0090DA] mt-0.5 shrink-0" />
          <p className="text-sm text-[#1A1A1A] leading-relaxed">
            {data.summary}
          </p>
        </div>
        <p className="text-sm font-medium text-[#0090DA]">
          {data.recommendation}
        </p>
      </div>
    </div>
  )
}
