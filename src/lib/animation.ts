// Shared animation variants for Phase 4 dashboard transition
// Used by SplitPanel (Plan 03) and DashboardLayout (Plan 03)

// Spring transition for panel resize/slide
export const panelTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 30,
  mass: 1,
};

// Section-level stagger (risks, products, partners, resources appear sequentially)
export const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.4,
    },
  },
};

export const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
};

// Card-level stagger within a section
export const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

export const cardVariants = {
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
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// Mobile transition variants (bottom-to-top instead of left-to-right)
export const mobileTransitionVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

// Mobile card stagger (slightly faster for smaller viewport)
export const mobileCardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};
