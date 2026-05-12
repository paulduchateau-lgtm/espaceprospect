import { Shield, TrendingUp, Users } from 'lucide-react'

const TRUST_DATA = [
  {
    icon: Shield,
    label: 'Régulée par l\'ACPR',
    detail: 'Autorité de Contrôle Prudentiel et de Résolution',
  },
  {
    icon: TrendingUp,
    label: 'Solidité financière',
    detail: 'Notation A1 (Moody\'s) - Groupe MetLife, Inc.',
  },
  {
    icon: Users,
    label: 'Confiance',
    detail: 'Plus de 100 millions d\'assurés dans le monde',
  },
] as const

export function TrustSignals() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {TRUST_DATA.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          <item.icon className="h-4 w-4 shrink-0 mt-0.5 text-metlife-green" />
          <div>
            <p className="text-xs font-medium text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
