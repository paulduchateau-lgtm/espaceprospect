import { Info } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <p>
        The recommendations presented are <strong>indicative</strong> and do
        not constitute insurance advice within the meaning of Article L.521-1
        of the Insurance Code. For a personalized analysis, please consult
        a MetLife advisor.
      </p>
    </div>
  )
}
