import { Chip } from "@/components/ui";
import type { TutorNoteData } from "../types";

type TutorNoteProps = {
  data?: TutorNoteData;
};

export function TutorNote({ data }: TutorNoteProps) {
  if (!data) {
    return null;
  }

  return (
    <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 shadow-hard-sm">
      <div className="mb-2 flex items-center gap-2">
        <Chip size="sm" variant="accent">
          Tutor
        </Chip>
        <p className="text-xs font-bold text-ink">{data.title}</p>
      </div>
      <p className="text-xs leading-5 text-muted">{data.content}</p>
    </div>
  );
}
