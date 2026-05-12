export const partners = {
  caarl: {
    name: "Caarl",
    tagline: "Assistance juridique pour TNS",
    description:
      "Protection juridique et accompagnement administratif pour les travailleurs non salariés.",
    icon: "Scale" as const,
    url: "#",
  },
  doado: {
    name: "Doado",
    tagline: "Prévention des TMS",
    description:
      "Programme personnalisé de prévention des troubles musculo-squelettiques adapté à votre activité.",
    icon: "Activity" as const,
    url: "#",
  },
  noctia: {
    name: "Noctia",
    tagline: "Gestion du sommeil",
    description:
      "Diagnostic et accompagnement pour améliorer la qualité du sommeil et réduire le stress.",
    icon: "Moon" as const,
    url: "#",
  },
} as const;

export type PartnerId = keyof typeof partners;
