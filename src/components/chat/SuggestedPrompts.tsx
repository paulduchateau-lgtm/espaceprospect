'use client';

import { Stethoscope, Wrench, Store, Laptop } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SUGGESTED_PROMPTS: Array<{
  label: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    label: 'Freelance physio',
    text: "I'm a freelance physiotherapist, 35 years old, established for 3 years. I'm mainly worried about work stoppages and the impact on my practice.",
    icon: Stethoscope,
  },
  {
    label: 'Construction worker',
    text: "I'm a self-employed plumber, 42 years old, with 2 employees. I just took out a loan for my business premises. What risks should I cover first?",
    icon: Wrench,
  },
  {
    label: 'Shop owner',
    text: "I'm a shop owner, 38 years old, running a downtown store. My spouse works with me. How can we protect our business and family?",
    icon: Store,
  },
  {
    label: 'Freelance consultant',
    text: "I'm a freelance IT consultant, 29 years old, sole proprietor. I currently have no supplementary social protection.",
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
        Welcome to your intelligent prospect space
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
        Describe your situation and discover how MetLife can support you.
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
