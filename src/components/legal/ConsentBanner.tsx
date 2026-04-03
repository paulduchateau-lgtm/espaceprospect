'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

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

  // Dashboard/espace routes bypass consent (already given during initial interaction)
  if (pathname.startsWith('/dashboard/') || pathname.startsWith('/espace/')) return <>{children}</>

  // SSR/hydration guard -- show children while checking (avoids flash)
  if (consented === null) return <>{children}</>
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
        <div
          className="w-full max-w-lg bg-white p-6 shadow-lg"
          style={{
            borderRadius: "12px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            {/* Gradient avatar icon — matches design system bot avatar */}
            <div
              className="shrink-0 flex items-center justify-center rounded-xl mt-0.5"
              style={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #0090DA, #A4CE4E)",
              }}
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lg text-[#1A1A1A]">
                Protection de vos données
              </h2>
              <p className="text-sm text-[#75787B] mt-1">
                Nous utilisons vos informations uniquement pour personnaliser nos
                recommandations de prévoyance. Vos données sont traitées conformément
                au RGPD et ne sont jamais partagées avec des tiers sans votre accord.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={acceptConsent}
              data-testid="consent-accept"
              className="font-semibold text-sm text-[#1A1A1A] transition-colors hover:brightness-95 active:brightness-90"
              style={{
                background: "#0090DA",
                color: "#FFFFFF",
                borderRadius: "0.375rem",
                padding: "8px 20px",
                border: "none",
                cursor: "pointer",
              }}
            >
              J&apos;accepte
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
