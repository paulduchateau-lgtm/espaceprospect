"use client"

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { Upload, FileImage, Loader2, X, AlertCircle, Plus, FileText, Check } from "lucide-react"
import type { ExtractedContract, ComparisonResult } from "@/lib/guarantee-types"

interface DocumentUploadProps {
  prospectId: string
  onAnalysisComplete: (data: {
    extraction: ExtractedContract
    comparison: ComparisonResult
  }) => void
}

type UploadState = "idle" | "analyzing" | "level-select" | "completing" | "error"

interface FileEntry {
  file: File
  preview: string | null
}

const VALID_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
]

const categoryLabels: Record<string, string> = {
  hospitalisation: "Hospitalisation",
  soins_courants: "Soins courants",
  optique: "Optique",
  dentaire: "Dentaire",
  medecine_douce: "Médecine douce",
  prevention: "Prévention",
}

export interface DocumentUploadHandle {
  addFileAndAnalyze: (file: File) => void
}

export const DocumentUpload = forwardRef<DocumentUploadHandle, DocumentUploadProps>(function DocumentUpload({ prospectId, onAnalysisComplete }, ref) {
  const [state, setState] = useState<UploadState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [extraction, setExtraction] = useState<ExtractedContract | null>(null)
  const [availableLevels, setAvailableLevels] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = []
    for (const file of Array.from(newFiles)) {
      if (!VALID_TYPES.includes(file.type)) {
        setError(`Format non supporté pour "${file.name}". Acceptés : JPEG, PNG, WebP, PDF.`)
        return
      }
      if (file.type === "application/pdf") {
        entries.push({ file, preview: null })
      } else {
        const url = URL.createObjectURL(file)
        entries.push({ file, preview: url })
      }
    }
    setError(null)
    setFiles(prev => [...prev, ...entries])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const next = [...prev]
      if (next[index].preview) URL.revokeObjectURL(next[index].preview!)
      next.splice(index, 1)
      return next
    })
  }, [])

  const analyze = useCallback(async (level?: string) => {
    if (files.length === 0) return

    const totalSize = files.reduce((s, f) => s + f.file.size, 0)
    if (totalSize > 20 * 1024 * 1024) {
      setError("Fichiers trop volumineux (max 20 Mo au total)")
      return
    }

    setError(null)
    setState(level ? "completing" : "analyzing")

    try {
      const formData = new FormData()
      for (const entry of files) {
        formData.append("documents", entry.file)
      }
      if (level) {
        formData.append("selectedLevel", level)
      }

      const res = await fetch(`/api/prospect/${prospectId}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }))
        throw new Error(data.error || `Erreur ${res.status}`)
      }

      const data = await res.json()

      if (data.needsLevelSelection) {
        setExtraction(data.extraction)
        setAvailableLevels(data.availableLevels)
        setState("level-select")
        return
      }

      setState("idle")
      onAnalysisComplete({ extraction: data.extraction, comparison: data.comparison })
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    }
  }, [files, prospectId, onAnalysisComplete])

  const handleLevelSelect = useCallback(async (level: string) => {
    setSelectedLevel(level)
    await analyze(level)
  }, [analyze])

  useImperativeHandle(ref, () => ({
    addFileAndAnalyze: (file: File) => {
      addFiles([file])
      setTimeout(() => analyze(), 200)
    },
  }), [addFiles, analyze])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ""
  }, [addFiles])

  const reset = () => {
    setState("idle")
    setError(null)
    files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview!) })
    setFiles([])
    setExtraction(null)
    setAvailableLevels([])
    setSelectedLevel(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const isProcessing = state === "analyzing" || state === "completing"
  const hasIncompletePages = extraction && extraction.total_pages !== null && extraction.detected_pages < extraction.total_pages
  const missingCategories = extraction?.missing_categories ?? []

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <FileImage className="h-5 w-5 text-[#0090DA]" />
          <h3 className="text-base font-semibold text-[#1A1A1A]">
            Analyser et comparer votre contrat
          </h3>
        </div>
        <p className="text-sm text-[#75787B] mb-4">
          Uploadez votre tableau de garanties, offre commerciale ou document de prévoyance.
          Notre IA détectera automatiquement le type et le comparera aux offres MetLife.
        </p>

        {/* File previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {files.map((entry, i) => (
              <div key={i} className="relative group">
                {entry.preview ? (
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="h-20 w-20 object-cover rounded-lg border border-[#E5E5E5]"
                  />
                ) : (
                  <div className="h-20 w-20 flex flex-col items-center justify-center rounded-lg border border-[#E5E5E5] bg-[#F7F7F7]">
                    <FileText className="h-6 w-6 text-[#A7A8AA]" />
                    <span className="text-[9px] text-[#75787B] mt-1 max-w-[70px] truncate">{entry.file.name}</span>
                  </div>
                )}
                {!isProcessing && (
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {!isProcessing && state !== "level-select" && (
              <button
                onClick={() => inputRef.current?.click()}
                className="h-20 w-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D9D9D6] hover:border-[#0090DA] hover:bg-[#F7F7F7] transition-all"
              >
                <Plus className="h-5 w-5 text-[#A7A8AA]" />
                <span className="text-[9px] text-[#75787B] mt-1">Ajouter</span>
              </button>
            )}
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="flex items-center gap-3 p-4 bg-[#0090DA]/5 rounded-lg mb-4">
            <Loader2 className="h-5 w-5 text-[#0090DA] animate-spin" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {state === "completing" ? "Génération du comparatif..." : "Analyse en cours..."}
              </p>
              <p className="text-xs text-[#75787B]">
                {state === "completing"
                  ? "Comparaison avec les offres MetLife (20-30s)"
                  : `Extraction des garanties depuis ${files.length} fichier${files.length > 1 ? 's' : ''} (30-60s)`}
              </p>
            </div>
          </div>
        )}

        {/* Level selection */}
        {state === "level-select" && availableLevels.length > 1 && (
          <div className="p-4 bg-amber-50 rounded-lg mb-4 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-3">
              Plusieurs niveaux de couverture détectés. Quel est le vôtre ?
            </p>
            <div className="flex flex-wrap gap-2">
              {availableLevels.map(level => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className="px-3 py-2 text-sm rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-medium transition-colors"
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Incomplete pages warning */}
        {state === "level-select" && (hasIncompletePages || missingCategories.length > 0) && (
          <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-1">
              {hasIncompletePages
                ? `Document incomplet : page${extraction!.detected_pages > 1 ? 's' : ''} ${extraction!.detected_pages} sur ${extraction!.total_pages} analysée${extraction!.detected_pages > 1 ? 's' : ''}`
                : "Catégories manquantes détectées"}
            </p>
            {missingCategories.length > 0 && (
              <p className="text-xs text-blue-700 mb-3">
                Non trouvées : {missingCategories.map(c => categoryLabels[c] || c).join(', ')}
              </p>
            )}
            <p className="text-xs text-blue-600 mb-2">
              Vous pouvez ajouter les pages manquantes pour une comparaison plus complète, ou continuer avec les données disponibles.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter des pages
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg mb-4 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={reset}
                className="text-xs text-red-600 hover:text-red-800 font-medium mt-1"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Drop zone — shown when no files or when adding more */}
        {!isProcessing && files.length === 0 && state !== "level-select" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all
              ${dragOver
                ? "border-[#0090DA] bg-[#0090DA]/5"
                : "border-[#D9D9D6] hover:border-[#0090DA] hover:bg-[#F7F7F7]"
              }
            `}
          >
            <Upload className={`h-8 w-8 mb-3 ${dragOver ? "text-[#0090DA]" : "text-[#A7A8AA]"}`} />
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">
              Glissez vos documents ici
            </p>
            <p className="text-xs text-[#75787B]">
              ou cliquez pour sélectionner — JPEG, PNG, WebP, PDF (max 20 Mo)
            </p>
          </div>
        )}

        {/* Analyze button */}
        {files.length > 0 && !isProcessing && state !== "level-select" && (
          <button
            onClick={() => analyze()}
            className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[#0090DA] text-white text-sm font-medium hover:bg-[#0061A0] transition-colors flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Analyser {files.length > 1 ? `${files.length} documents` : "le document"}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
})
