import { Info } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <p>
        Les recommandations presentees sont <strong>indicatives</strong> et ne
        constituent pas un conseil en assurance au sens de l&apos;article L.521-1
        du Code des assurances. Pour une analyse personnalisee, veuillez consulter
        un conseiller MetLife.
      </p>
    </div>
  )
}
