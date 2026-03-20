export const partners = {
  caarl: {
    name: "Caarl",
    tagline: "Assistance juridique pour TNS",
    description:
      "Protection juridique et accompagnement administratif pour les travailleurs non salaries.",
    icon: "Scale" as const,
    url: "#",
  },
  doado: {
    name: "Doado",
    tagline: "Prevention des TMS",
    description:
      "Programme personnalise de prevention des troubles musculo-squelettiques adapte a votre activite.",
    icon: "Activity" as const,
    url: "#",
  },
  noctia: {
    name: "Noctia",
    tagline: "Gestion du sommeil",
    description:
      "Diagnostic et accompagnement pour ameliorer la qualite du sommeil et reduire le stress.",
    icon: "Moon" as const,
    url: "#",
  },
} as const;

export type PartnerId = keyof typeof partners;
