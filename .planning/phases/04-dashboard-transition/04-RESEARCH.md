# Phase 4 Research: Dashboard & Transition Animation

**Date:** 2026-03-20
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Goal:** Build the personalized dashboard and implement the animated chat-to-dashboard transition -- the prototype's "wow moment."

---

## 1. CSS/Motion Layout Transitions

### 1.1 Motion Library (formerly Framer Motion) -- Layout Animations

The project uses **Motion v12.37.x** (the package formerly known as `framer-motion`, now published as `motion`). The `layout` prop is the key feature for the chat-to-dashboard transition: it automatically animates an element's size and position whenever a React re-render causes a layout change. This works even for properties that CSS transitions cannot handle (e.g., `justify-content`, grid column changes, width transitions driven by state).

**Core mechanism for the split-panel transition:**

```tsx
import { motion } from "motion/react";

type Phase = "chatting" | "analyzing" | "dashboard";

function ProspectPage() {
  const [phase, setPhase] = useState<Phase>("chatting");

  return (
    <div className="flex h-screen">
      {/* Chat panel -- animates width change automatically */}
      <motion.div
        layout
        className={phase === "dashboard" ? "w-1/3" : "w-full"}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        <ChatPanel />
      </motion.div>

      {/* Dashboard panel -- slides in from right */}
      <AnimatePresence>
        {phase === "dashboard" && (
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            <Dashboard data={dashboardData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Why `layout` over CSS transitions:** CSS `transition` cannot animate between `width: 100%` and `width: 33%` smoothly when the element contains a scrollable chat panel with variable-height children. Motion's `layout` prop uses FLIP (First, Last, Invert, Play) under the hood, measuring actual DOM positions before and after the re-render, then animating the transform. This avoids layout thrashing and produces 60fps transitions even with complex child content.

### 1.2 Spring vs Tween Transitions

For the chat-to-dashboard transition, **spring physics** feel more natural than linear or eased tweens:

```tsx
// Recommended: spring with moderate stiffness
const panelTransition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
  mass: 1,
};

// Alternative: tween with custom easing (feels more "designed")
const panelTransitionTween = {
  type: "tween",
  duration: 0.6,
  ease: [0.32, 0.72, 0, 1], // custom cubic-bezier for smooth deceleration
};
```

Spring is preferred because it handles interruptions gracefully -- if the user triggers a state change mid-animation, the spring naturally redirects without snapping. Tween would require explicit interruption handling.

### 1.3 AnimatePresence for Mount/Unmount

The dashboard panel does not exist in the DOM during the `chatting` phase. `AnimatePresence` from Motion enables exit animations on components that are being unmounted:

```tsx
import { AnimatePresence, motion } from "motion/react";

<AnimatePresence mode="wait">
  {phase === "dashboard" && (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={panelTransition}
    >
      <Dashboard />
    </motion.div>
  )}
</AnimatePresence>
```

`mode="wait"` ensures the exiting component completes its animation before the entering one begins. For our use case, `mode="sync"` (default) is better since the chat panel shrinks simultaneously as the dashboard slides in.

---

## 2. Split-Panel Layout

### 2.1 CSS Grid vs Flexbox

**Recommendation: Flexbox** for the top-level split, with CSS Grid inside the dashboard for the card grid.

**Why Flexbox for the split:**
- The chat panel has a dynamic width (`w-full` -> `w-1/3`) controlled by state. Flexbox with `flex-shrink` and `flex-grow` handles this naturally.
- Motion's `layout` prop works best when animating flex properties rather than grid track changes (grid-template-columns animations are possible but less smooth).
- Flexbox avoids the complexity of animating CSS Grid `grid-template-columns` values, which Motion cannot interpolate natively.

```tsx
// Top-level layout: Flexbox
<div className="flex h-screen overflow-hidden">
  <motion.div
    layout
    className={cn(
      "flex flex-col border-r border-border",
      phase === "dashboard" ? "w-1/3 min-w-[320px]" : "w-full max-w-3xl mx-auto"
    )}
    transition={panelTransition}
  >
    <ChatPanel />
  </motion.div>

  <AnimatePresence>
    {phase === "dashboard" && (
      <motion.div
        key="dashboard-panel"
        className="flex-1 overflow-y-auto bg-muted"
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        transition={panelTransition}
      >
        <DashboardLayout data={dashboardData} />
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

### 2.2 Chat Panel Width Constraints

When the chat panel shrinks to 1/3, it must remain usable:
- **Minimum width:** `min-w-[320px]` prevents the chat from becoming unreadably narrow.
- **Max width when full-screen:** `max-w-3xl mx-auto` centers the chat comfortably when it occupies the full width, avoiding overly wide message bubbles on large screens.
- **Scroll preservation:** The chat panel must maintain its scroll position during the width transition. Motion's `layout` prop handles this automatically since it animates transforms, not actual width reflow.

### 2.3 Responsive Breakpoints

```
Desktop (>= 1024px):  Chat 1/3 | Dashboard 2/3 (side-by-side)
Tablet (768-1023px):   Full-screen swap with tab navigation
Mobile (< 768px):      Full-screen swap with bottom tab bar
```

Implementation pattern for the responsive split:

```tsx
function ProspectPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [phase, setPhase] = useState<Phase>("chatting");
  const [mobileView, setMobileView] = useState<"chat" | "dashboard">("chat");

  if (!isDesktop && phase === "dashboard") {
    // Mobile/tablet: full-screen swap
    return (
      <div className="h-screen flex flex-col">
        <div className="flex border-b border-border">
          <button
            className={cn("flex-1 py-3 text-sm font-medium",
              mobileView === "chat" && "border-b-2 border-primary"
            )}
            onClick={() => setMobileView("chat")}
          >
            Conversation
          </button>
          <button
            className={cn("flex-1 py-3 text-sm font-medium",
              mobileView === "dashboard" && "border-b-2 border-primary"
            )}
            onClick={() => setMobileView("dashboard")}
          >
            Mon espace
          </button>
        </div>
        <AnimatePresence mode="wait">
          {mobileView === "chat" ? (
            <motion.div key="chat" className="flex-1 overflow-y-auto" {...fadeVariant}>
              <ChatPanel />
            </motion.div>
          ) : (
            <motion.div key="dashboard" className="flex-1 overflow-y-auto" {...fadeVariant}>
              <DashboardLayout data={dashboardData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: side-by-side split
  return (/* ... side-by-side layout from section 2.1 ... */);
}
```

### 2.4 useMediaQuery Hook

A lightweight hook for responsive detection (avoids pulling in a full library):

```tsx
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
```

---

## 3. Dashboard Card Components

### 3.1 Card Types and Data Mapping

The dashboard renders four card categories, each backed by the structured JSON that Claude produces via `tool_use` (see Phase 2 architecture -- `generate_dashboard` tool):

| Card Type | Data Source | Visual Treatment |
|-----------|-----------|-----------------|
| **Risk Card** | `dashboardData.risks[]` | Severity badge (high/medium/low with color coding), icon per risk category, personalized description |
| **Product Card** | `dashboardData.products[]` | MetLife product name, relevance explanation, link to product page, coverage type badge |
| **Partner Card** | `dashboardData.partners[]` | Caarl/Doado/Noctia branding, service description, relevance to prospect profile |
| **Resource Card** | `dashboardData.resources[]` | Article title, type badge (article/guide/tool), external link |

### 3.2 shadcn/ui Card Structure

shadcn/ui v4 provides `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`, and `Badge` components. These are copy-pasted into the project (not imported from a package), giving full control for MetLife branding.

**Risk Card implementation:**

```tsx
// src/components/dashboard/RiskCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import type { Risk } from "@/lib/types";

const severityConfig = {
  high: {
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Risque elevee",
    icon: ShieldAlert,
  },
  medium: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    label: "Risque modere",
    icon: Shield,
  },
  low: {
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Risque faible",
    icon: ShieldCheck,
  },
};

export function RiskCard({ risk }: { risk: Risk }) {
  const config = severityConfig[risk.severity];
  const Icon = config.icon;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: `var(--color-${risk.severity})` }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-base">{risk.label}</CardTitle>
          </div>
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {risk.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
```

**Product Card implementation:**

```tsx
// src/components/dashboard/ProductCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { ProductRecommendation } from "@/lib/types";

export function ProductCard({ product }: { product: ProductRecommendation }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{product.name}</CardTitle>
          <Badge variant="secondary">{product.coverageType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {product.relevance}
        </CardDescription>
      </CardContent>
      {product.url && (
        <CardFooter>
          <Button variant="outline" size="sm" asChild>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              En savoir plus <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

**Partner Card implementation:**

```tsx
// src/components/dashboard/PartnerCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Scale, Activity, Moon } from "lucide-react";
import { partners } from "@/config/partners";
import type { PartnerRecommendation } from "@/lib/types";

const partnerIcons = { caarl: Scale, doado: Activity, noctia: Moon };

export function PartnerCard({ partner }: { partner: PartnerRecommendation }) {
  const config = partners[partner.id];
  const Icon = partnerIcons[partner.id];

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{config.name}</CardTitle>
            <CardDescription className="text-xs">{config.tagline}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{partner.relevance}</p>
      </CardContent>
    </Card>
  );
}
```

### 3.3 Dashboard Grid Layout

Inside the dashboard panel, CSS Grid organizes the card sections:

```tsx
// src/components/dashboard/DashboardLayout.tsx
import type { DashboardData } from "@/lib/types";

export function DashboardLayout({ data }: { data: DashboardData }) {
  return (
    <div className="p-6 space-y-8">
      {/* Profile summary */}
      <section>
        <h2 className="text-lg font-semibold mb-1">
          Votre profil: {data.profile.profession}
        </h2>
        <p className="text-sm text-muted-foreground">
          Secteur: {data.profile.sector}
        </p>
      </section>

      {/* Risk cards */}
      <section>
        <h3 className="text-md font-semibold mb-3">Risques identifies</h3>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {data.risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      {/* Product cards */}
      <section>
        <h3 className="text-md font-semibold mb-3">Solutions MetLife recommandees</h3>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Partner cards */}
      {data.partners.length > 0 && (
        <section>
          <h3 className="text-md font-semibold mb-3">Services partenaires</h3>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            {data.partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </section>
      )}

      {/* Resources */}
      {data.resources.length > 0 && (
        <section>
          <h3 className="text-md font-semibold mb-3">Ressources utiles</h3>
          <ResourceList resources={data.resources} />
        </section>
      )}

      {/* CTA -- always visible (DASH-04) */}
      <AdvisorCTA />
    </div>
  );
}
```

---

## 4. Progressive Reveal Patterns

### 4.1 Staggered Card Animation with Motion Variants

Motion's `staggerChildren` orchestration creates the card-by-card progressive reveal. The parent defines the stagger timing; children define their individual animation:

```tsx
// Variant definitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // 120ms between each card
      delayChildren: 0.2,    // 200ms initial delay after dashboard slides in
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};
```

**Applied to a card section:**

```tsx
import { motion } from "motion/react";

function RiskCardSection({ risks }: { risks: Risk[] }) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {risks.map((risk) => (
        <motion.div key={risk.id} variants={cardVariants}>
          <RiskCard risk={risk} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 4.2 Section-Level Stagger

For the full dashboard, stagger entire sections (risks, then products, then partners, then resources) with an outer container that staggers section groups:

```tsx
const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, // 300ms between each section
      delayChildren: 0.4,   // Wait for slide-in to finish
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
};
```

This produces a cascading effect: the dashboard slides in, then sections appear top-to-bottom, and within each section, individual cards fan out with their own stagger. The nested stagger creates a natural, professional "progressive reveal."

### 4.3 Animation Sequence

The complete transition timeline:

```
T+0ms      AI response completes, phase changes to "analyzing"
T+0ms      Brief "analyzing" indicator appears (optional pulse/spinner)
T+300ms    Phase changes to "dashboard"
T+300ms    Chat panel begins shrinking (w-full -> w-1/3, spring ~600ms)
T+300ms    Dashboard panel begins sliding in from right (spring ~600ms)
T+700ms    Dashboard is in position, section stagger begins
T+700ms    Section 1 (Profile summary) fades in
T+1000ms   Section 2 (Risk cards) fades in, cards stagger at 120ms intervals
T+1300ms   Section 3 (Product cards) fades in, cards stagger
T+1600ms   Section 4 (Partner cards) fades in
T+1900ms   Section 5 (Resources + CTA) fades in
T+~2200ms  Full dashboard is visible
```

Total transition time: approximately 2 seconds from AI completion to full dashboard. This is fast enough to feel responsive, slow enough for the user to absorb each section.

---

## 5. Data Flow: AI Response to Dashboard

### 5.1 Structured Output Extraction

Phase 2 established the `generate_dashboard` tool via Claude's `tool_use`. When the AI response stream completes, the API route extracts the structured JSON from the tool call result and sends it as a final SSE event:

```tsx
// In the API route (POST /api/chat)
// After Claude stream completes, extract tool_use result:
const toolUseBlock = response.content.find(
  (block) => block.type === "tool_use" && block.name === "generate_dashboard"
);

if (toolUseBlock) {
  const dashboardData = toolUseBlock.input as DashboardData;
  // Send as a special SSE event
  encoder.encode(`event: dashboard\ndata: ${JSON.stringify(dashboardData)}\n\n`);
}
```

### 5.2 Client-Side Data Reception

The client receives both streamed text and the dashboard payload through the same SSE connection:

```tsx
// src/hooks/useChatWithDashboard.ts
import { useState, useCallback } from "react";
import type { DashboardData, ChatMessage } from "@/lib/types";

export function useChatWithDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [phase, setPhase] = useState<"chatting" | "analyzing" | "dashboard">("chatting");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    // Add user message
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content, createdAt: new Date() }]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let assistantContent = "";

    // Process SSE stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          // Regular text chunk
          assistantContent += data;
          // Update streaming message...
        } else if (line.startsWith("event: dashboard")) {
          // Next data line contains dashboard JSON
          const nextDataLine = lines[lines.indexOf(line) + 1];
          if (nextDataLine?.startsWith("data: ")) {
            const dashboardJson = JSON.parse(nextDataLine.slice(6));
            setDashboardData(dashboardJson);
            setPhase("dashboard");
          }
        }
      }
    }

    setIsStreaming(false);
  }, []);

  return { messages, dashboardData, phase, isStreaming, sendMessage };
}
```

### 5.3 Zod Validation of Dashboard Data

Before rendering, validate the structured JSON against a Zod schema to prevent rendering errors from malformed AI output:

```tsx
// src/lib/schemas.ts
import { z } from "zod";

export const riskSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  description: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  relevance: z.string(),
  url: z.string().optional(),
  coverageType: z.string().optional(),
});

export const partnerSchema = z.object({
  id: z.enum(["caarl", "doado", "noctia"]),
  relevance: z.string(),
});

export const resourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(["article", "guide", "tool", "faq"]),
});

export const dashboardDataSchema = z.object({
  risks: z.array(riskSchema),
  products: z.array(productSchema),
  partners: z.array(partnerSchema).optional().default([]),
  resources: z.array(resourceSchema).optional().default([]),
  profile: z.object({
    profession: z.string(),
    sector: z.string(),
    concerns: z.array(z.string()),
  }),
});
```

Usage:

```tsx
const parsed = dashboardDataSchema.safeParse(rawDashboardJson);
if (parsed.success) {
  setDashboardData(parsed.data);
  setPhase("dashboard");
} else {
  console.error("Invalid dashboard data from AI:", parsed.error);
  // Fallback: show error state or retry
}
```

---

## 6. Mobile Adaptation

### 6.1 Strategy: Full-Screen Swap with Tab Navigation

On mobile and tablet (`< 1024px`), the side-by-side split does not work -- 320px minimum for the chat panel leaves too little room for a meaningful dashboard. Instead, the layout switches to a full-screen swap with a tab bar:

- **During `chatting` phase:** Full-screen chat (no tabs visible yet).
- **When dashboard data arrives:** A tab bar appears at the top. The view automatically switches to the dashboard tab with a crossfade animation. The user can tap "Conversation" to return to the chat.
- **The CTA "Contacter un conseiller" remains visible** as a sticky bottom button on mobile, regardless of which tab is active.

### 6.2 Mobile Transition Animation

On mobile, the dashboard appears with a bottom-to-top slide instead of left-to-right:

```tsx
const mobileTransitionVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};
```

Cards still use staggered reveal within the mobile dashboard, but with slightly reduced delays (80ms between cards vs 120ms on desktop) since the viewport is smaller and the user can see fewer cards at once.

### 6.3 Touch Considerations

- Cards should have minimum `44px` tap targets (Apple HIG recommendation).
- The CTA button uses `min-h-[48px]` for comfortable mobile tapping.
- Dashboard sections use `scroll-snap-type: y mandatory` for predictable scroll stops on card sections.

---

## 7. Advisor CTA -- Always Visible (DASH-04)

The "Contacter un conseiller MetLife" CTA must be visible at all times per requirement DASH-04.

### 7.1 Desktop Implementation

On desktop, the CTA is a sticky card pinned to the bottom of the dashboard panel:

```tsx
// src/components/dashboard/AdvisorCTA.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";

export function AdvisorCTA() {
  return (
    <Card className="sticky bottom-4 border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-semibold text-sm">
            Vous souhaitez aller plus loin ?
          </p>
          <p className="text-xs text-muted-foreground">
            Un conseiller MetLife peut vous accompagner
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark">
          <Phone className="mr-2 h-4 w-4" />
          Contacter un conseiller
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 7.2 Mobile Implementation

On mobile, the CTA becomes a fixed bottom bar that persists across both chat and dashboard tabs:

```tsx
// Fixed bottom CTA on mobile
<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-3 lg:hidden">
  <Button className="w-full bg-primary hover:bg-primary-dark min-h-[48px]">
    <Phone className="mr-2 h-4 w-4" />
    Contacter un conseiller MetLife
  </Button>
</div>
```

---

## 8. Preventing Layout Jumps and Content Flash

### 8.1 Anti-Flash Techniques

To meet the success criterion "no layout jumps, no content flash":

1. **Pre-measure chat panel:** Before transitioning, capture the chat panel's scroll position and dimensions. Motion's `layout` prop handles this automatically.

2. **Skeleton placeholders:** During the brief `analyzing` phase (before dashboard data arrives), show skeleton cards in the dashboard panel to prevent a blank flash:

```tsx
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

3. **`overflow-hidden` on parent:** During the transition, the parent container must have `overflow-hidden` to prevent horizontal scrollbar flash as the dashboard slides in from off-screen.

4. **`will-change: transform`:** Applied via Motion automatically, but worth noting: the animating panels get GPU-accelerated compositing to prevent jank.

5. **Avoid width transitions on text:** The chat messages should not reflow during the width transition. Instead, the chat panel container clips its content and scrolls, so messages maintain their width and simply become scrollable in the narrower panel.

### 8.2 Content Reflow Strategy

When the chat panel shrinks from full-width to 1/3, message bubbles need to reflow. This can cause visible text rewrapping. To mitigate:

- **Option A (recommended):** Set a `max-w-[480px]` on message bubbles from the start, so they never use the full chat panel width. When the panel shrinks to 1/3 (~400px on a 1200px screen), the messages already fit without reflow.
- **Option B:** During the transition, apply `overflow-hidden` to the chat panel and let messages clip. After the transition completes, allow reflow.

Option A is simpler and produces the cleanest visual result.

---

## Validation Architecture

### Test Categories

| Category | What to Test | Tool |
|----------|-------------|------|
| **Unit tests** | Zod schema validation of dashboard data, variant/animation config correctness | Vitest |
| **Component tests** | Card components render correctly with valid/empty/partial data | Vitest + React Testing Library |
| **Visual regression** | Dashboard layout at desktop/tablet/mobile breakpoints, card appearance by severity | Playwright screenshot comparison |
| **Animation tests** | Transition triggers at correct phase, stagger timing, no layout jumps | Playwright + manual QA |
| **Integration tests** | Full flow: AI response -> SSE parsing -> Zod validation -> dashboard render | Playwright E2E |
| **Accessibility** | Keyboard navigation through dashboard cards, screen reader labels, focus management on transition | axe-core + manual |

### Validation Checklist (Maps to Success Criteria)

**SC-1: Chat panel animates to 1/3 width and dashboard slides in with progressive card reveal**
- [ ] `phase` state transitions correctly: `chatting` -> `dashboard`
- [ ] Chat panel width changes from `w-full` to `w-1/3` with spring animation
- [ ] Dashboard panel enters from the right with `x: 300 -> 0` animation
- [ ] Cards appear with staggered delays (verify `staggerChildren: 0.12` produces visible cascade)
- [ ] Animation completes in under 2.5 seconds total
- [ ] Test with Playwright: screenshot at T+0, T+500ms, T+1000ms, T+2000ms to verify progressive reveal

**SC-2: Dashboard displays risk cards, product cards, partner cards, and resource links**
- [ ] Risk cards render with correct severity badges and icons for `high`, `medium`, `low`
- [ ] Product cards show name, relevance explanation, and external link
- [ ] Partner cards display Caarl, Doado, and Noctia with correct icons and descriptions
- [ ] Resource links render with type badges and functional URLs
- [ ] Empty states: dashboard handles zero partners or zero resources gracefully (section hidden)
- [ ] Malformed AI output: Zod validation rejects invalid data and shows error state

**SC-3: "Contact a MetLife advisor" CTA always visible**
- [ ] Desktop: CTA card is sticky at bottom of dashboard panel, visible when scrolling
- [ ] Mobile: Fixed bottom bar visible on both chat and dashboard tabs
- [ ] CTA is visible immediately when dashboard appears (not delayed by stagger animation)

**SC-4: Smooth transition -- no layout jumps, no content flash**
- [ ] No horizontal scrollbar appears during transition (verify `overflow-hidden` on parent)
- [ ] Chat scroll position is preserved during width change
- [ ] No blank white flash between chat-only and split view
- [ ] Message bubbles do not visibly rewrap during transition (`max-w-[480px]` constraint)
- [ ] Dashboard skeleton shows during `analyzing` phase (if applicable)
- [ ] Test at 1024px, 1440px, and 1920px widths for consistent behavior

### Playwright E2E Test Structure

```tsx
// e2e/dashboard-transition.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard Transition", () => {
  test("chat shrinks and dashboard slides in after AI response", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Decrivez votre situation").fill(
      "Je suis kine liberal, 35 ans, je viens d'ouvrir mon cabinet"
    );
    await page.getByRole("button", { name: "Envoyer" }).click();

    // Wait for dashboard to appear
    await expect(page.getByTestId("dashboard-panel")).toBeVisible({ timeout: 30000 });

    // Verify risk cards are present
    await expect(page.getByTestId("risk-card").first()).toBeVisible();

    // Verify CTA is visible
    await expect(page.getByRole("button", { name: /contacter.*conseiller/i })).toBeVisible();

    // Verify chat panel is narrowed
    const chatPanel = page.getByTestId("chat-panel");
    const chatBox = await chatPanel.boundingBox();
    const viewport = page.viewportSize()!;
    expect(chatBox!.width).toBeLessThan(viewport.width * 0.5);
  });

  test("mobile: tab navigation between chat and dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    // ... trigger AI response ...

    // Dashboard tab should be active
    await expect(page.getByRole("tab", { name: "Mon espace" })).toBeVisible();

    // Switch to chat
    await page.getByRole("tab", { name: "Conversation" }).click();
    await expect(page.getByTestId("chat-panel")).toBeVisible();

    // CTA visible on both views
    await expect(page.getByRole("button", { name: /contacter.*conseiller/i })).toBeVisible();
  });
});
```

### Data Validation Flow

```
Claude tool_use response
  |
  v
API route extracts tool_use block
  |
  v
JSON parsed -> dashboardDataSchema.safeParse()
  |
  +-- success: send dashboard SSE event
  |
  +-- failure: log error, send fallback SSE event
       with generic "contact advisor" dashboard
  |
  v
Client receives SSE event
  |
  v
Client-side Zod re-validation (defense in depth)
  |
  v
setDashboardData() -> phase = "dashboard" -> render
```

---

## 9. File Structure for Phase 4

Files to create or modify:

```
src/
  components/
    dashboard/
      DashboardLayout.tsx     # Main dashboard grid, section orchestration
      RiskCard.tsx             # Risk card with severity badge
      ProductCard.tsx          # Product card with relevance + link
      PartnerCard.tsx          # Caarl/Doado/Noctia cards
      ResourceList.tsx         # Resource links list
      AdvisorCTA.tsx           # Sticky CTA component
      DashboardSkeleton.tsx    # Loading skeleton for analyzing phase
    layout/
      SplitPanel.tsx           # Top-level chat/dashboard split layout
      MobileTabBar.tsx         # Tab navigation for mobile
  hooks/
    useChatWithDashboard.ts    # Combined chat + dashboard data hook
    useMediaQuery.ts           # Responsive breakpoint detection
  lib/
    schemas.ts                 # Zod schemas (add dashboard validation)
    animation.ts               # Shared animation variants and transitions
```

---

## 10. Dependencies Needed

All dependencies are already in the stack (no new packages required):

| Package | Version | Already in Stack | Used For |
|---------|---------|-----------------|----------|
| `motion` | 12.37.x | Yes | `layout`, `AnimatePresence`, `staggerChildren`, spring transitions |
| shadcn/ui Card, Badge, Button | v4 | Yes | All card components, CTA |
| `lucide-react` | latest | Yes | Risk/partner icons (`ShieldAlert`, `Scale`, `Moon`, etc.) |
| `zod` | 4.3.x | Yes | Dashboard data validation |
| Tailwind CSS 4 | 4.2.x | Yes | Grid layout, responsive breakpoints, MetLife theme |

No additional packages need to be installed for Phase 4.

---

## Sources

- [Motion Layout Animations](https://motion.dev/docs/react-layout-animations)
- [Motion Transition Orchestration (staggerChildren, delayChildren)](https://motion.dev/docs/vue-transitions)
- [Motion AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [shadcn/ui Card Component](https://ui.shadcn.com/docs/components/base/card)
- [shadcn/ui Blocks (Dashboard Layouts)](https://ui.shadcn.com/docs/changelog/2024-03-blocks)
- [Motion Official Examples](https://motion.dev/examples)
- [Creating Staggered Animations with Framer Motion](https://medium.com/@onifkay/creating-staggered-animations-with-framer-motion-0e7dc90eae33)
- [Animate Layout in Next.js Using Motion's layout Prop](https://staticmania.com/blog/animate-layout-in-next.js-using-motions-layout-prop)
- [Building a Responsive Dashboard with React and Framer Motion](https://medium.com/@kodithuwakkumadhumini12/building-a-responsive-dashboard-with-react-and-framer-motion-in-wellness-buddy-32ffb58e962d)
- [Everything about Framer Motion Layout Animations - Maxime Heckel](https://blog.maximeheckel.com/posts/framer-motion-layout-animations/)

---

*Research completed 2026-03-20. All patterns verified against Motion v12.x docs and shadcn/ui v4 component API.*
