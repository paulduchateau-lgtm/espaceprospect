export function ChatHeader() {
  return (
    <header className="flex items-center gap-3 px-4 border-b border-border bg-white shrink-0" style={{ height: 64 }}>
      {/* MetLife logo */}
      <img
        src="/metlife-logo.png"
        alt="MetLife"
        className="h-8 shrink-0"
      />

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Bot avatar — gradient circle with bot icon */}
      <div
        className="shrink-0 flex items-center justify-center rounded-[10px]"
        style={{
          width: 36,
          height: 36,
          background: "linear-gradient(135deg, #0090DA, #A4CE4E)",
        }}
        aria-hidden="true"
      >
        {/* Bot icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"/>
          <circle cx="12" cy="5" r="2"/>
          <line x1="12" y1="7" x2="12" y2="11"/>
          <line x1="8" y1="16" x2="8" y2="16.01"/>
          <line x1="16" y1="16" x2="16" y2="16.01"/>
        </svg>
      </div>

      {/* Title + status */}
      <div>
        <h1 className="text-sm font-semibold text-[#1A1A1A]">
          Assistant MetLife AI
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A4CE4E]" />
          <span className="text-[11px] text-[#A4CE4E] font-medium">Online</span>
        </div>
      </div>
    </header>
  );
}
