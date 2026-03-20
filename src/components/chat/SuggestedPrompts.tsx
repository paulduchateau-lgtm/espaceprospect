'use client';

import { Stethoscope, Wrench, Store, Laptop } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SUGGESTED_PROMPTS: Array<{
  label: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    label: 'Kiné libéral',
    text: "Je suis kinésithérapeute libéral, 35 ans, installé depuis 3 ans. Je m'inquiète surtout pour les arrêts de travail et l'impact sur mon cabinet.",
    icon: Stethoscope,
  },
  {
    label: 'Artisan du bâtiment',
    text: "Je suis artisan plombier, 42 ans, avec 2 salariés. Je viens de contracter un prêt pour mon local professionnel. Quels risques dois-je couvrir en priorité ?",
    icon: Wrench,
  },
  {
    label: 'Commerçante',
    text: "Je suis commerçante, 38 ans, je gère une boutique en centre-ville. Mon conjoint travaille avec moi. Comment protéger notre activité et notre famille ?",
    icon: Store,
  },
  {
    label: 'Consultant indépendant',
    text: "Je suis consultant IT en freelance, 29 ans, micro-entrepreneur. Je n'ai aucune protection sociale complémentaire pour le moment.",
    icon: Laptop,
  },
];

interface SuggestedPromptsProps {
  onPromptClick: (text: string) => void;
}

export function SuggestedPrompts({ onPromptClick }: SuggestedPromptsProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <img
        src="/metlife-logo.png"
        alt="MetLife"
        className="h-10 mb-6"
      />
      <h2 className="text-xl font-semibold text-primary-dark mb-2 text-center">
        Bienvenue dans votre espace prospect intelligent
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
        Décrivez votre situation et découvrez comment MetLife peut vous accompagner.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {SUGGESTED_PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <button
              key={prompt.label}
              type="button"
              onClick={() => onPromptClick(prompt.text)}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-left text-sm hover:bg-muted hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
            >
              <Icon className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">{prompt.label}</span>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                  {prompt.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SUGGESTED_PROMPTS };
