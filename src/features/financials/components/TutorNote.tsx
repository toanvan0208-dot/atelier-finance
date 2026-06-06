import { Chip } from "@/components/ui";
import type { TutorNoteData } from "../types";

type TutorNoteProps = {
  data: TutorNoteData;
};

export function TutorNote({ data }: TutorNoteProps) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft/70 px-4 py-3 shadow-soft">
      <Chip size="sm" variant="accent">{data.title}</Chip>
      <p className="mt-2 text-sm leading-6 text-muted">{data.content}</p>
    </div>
  );
}
