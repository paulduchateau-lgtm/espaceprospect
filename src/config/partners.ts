export const partners = {
  caarl: {
    name: "Caarl",
    tagline: "Legal assistance for self-employed",
    description:
      "Legal protection and administrative support for self-employed workers.",
    icon: "Scale" as const,
    url: "#",
  },
  doado: {
    name: "Doado",
    tagline: "MSD prevention",
    description:
      "Personalized musculoskeletal disorder prevention program tailored to your activity.",
    icon: "Activity" as const,
    url: "#",
  },
  noctia: {
    name: "Noctia",
    tagline: "Sleep management",
    description:
      "Diagnosis and support to improve sleep quality and reduce stress.",
    icon: "Moon" as const,
    url: "#",
  },
} as const;

export type PartnerId = keyof typeof partners;
