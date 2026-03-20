'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

const CONSENT_KEY = 'metlife-rgpd-consent'

export function ConsentBanner({ children }: { children: React.ReactNode }) {
  const [consented, setConsented] = useState<boolean | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setConsented(localStorage.getItem(CONSENT_KEY) === 'true')
  }, [])

  const acceptConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setConsented(true)
  }

  // Dashboard routes bypass consent (already given during initial interaction)
  if (pathname.startsWith('/dashboard/')) return <>{children}</>

  // SSR/hydration guard -- render nothing until client-side check
  if (consented === null) return null
  if (consented) return <>{children}</>

  return (
    <>
      <div className="pointer-events-none opacity-50" aria-hidden="true">
        {children}
      </div>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Consentement RGPD"
      >
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-6 w-6 text-metlife-green shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-lg text-foreground">
                Protection de vos donnees
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Nous utilisons vos informations uniquement pour personnaliser nos
                recommandations de prevoyance. Vos donnees sont traitees conformement
                au RGPD et ne sont jamais partagees avec des tiers sans votre accord.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={acceptConsent} data-testid="consent-accept">
              J&apos;accepte
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
