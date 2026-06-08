"use client";

type ReflectionBoxProps = {
  placeholder: string;
};

export function ReflectionBox({ placeholder }: ReflectionBoxProps) {
  return (
    <textarea
      className="min-h-28 w-full resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-subtle focus:bg-accent-soft/35"
      placeholder={placeholder}
    />
  );
}
