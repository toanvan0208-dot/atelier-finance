type RightAssistantPanelProps = {
  activeLabel: string;
  title: string;
  messages: Array<{
    variant: string;
    content: string;
  }>;
};

export function RightAssistantPanel({
  activeLabel,
  title,
  messages,
}: RightAssistantPanelProps) {
  return (
    <aside className="hidden border-l-[1.5px] border-border bg-[#E7F1C8] px-5 py-6 md:block">
      <div className="sticky top-[80px]">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.04em] text-ink">
          {title}
        </p>

        <section className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
          <div className="border-b border-border-soft bg-surface-soft px-4 py-3">
            <p className="text-xs font-bold text-ink">{activeLabel}</p>
          </div>
          <div className="space-y-3 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.content}
                className={
                  message.variant === "accent"
                    ? "rounded-[4px] border border-border bg-accent-soft/70 px-3 py-2 text-xs leading-6 text-ink"
                    : "rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-6 text-muted"
                }
              >
                {message.content}
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
