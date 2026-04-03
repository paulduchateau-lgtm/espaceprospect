export function LoadingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3" aria-label="The assistant is analyzing your situation...">
      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
