export function ChatHeader() {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
      <img
        src="/metlife-logo.png"
        alt="MetLife"
        className="h-8"
      />
      <div>
        <h1 className="text-sm font-semibold text-primary-dark">
          Espace Prospect Intelligent
        </h1>
        <p className="text-xs text-muted-foreground">
          Votre assistant prévoyance TNS
        </p>
      </div>
    </header>
  );
}
