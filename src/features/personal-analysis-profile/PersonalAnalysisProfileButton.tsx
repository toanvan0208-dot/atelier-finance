"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { usePersonalAnalysisProfile } from "./PersonalAnalysisProfileContext";

type PersonalAnalysisProfileButtonProps = {
  placement?: "topbar" | "floating";
};

export function PersonalAnalysisProfileButton({
  placement = "topbar",
}: PersonalAnalysisProfileButtonProps) {
  const { openDrawer } = usePersonalAnalysisProfile();
  const isFloating = placement === "floating";

  return (
    <Button
      aria-label="Mở Hồ sơ phân tích cá nhân"
      className={cn(
        isFloating
          ? "fixed bottom-20 right-4 z-40 h-11 rounded-[4px] px-3 shadow-hard-sm md:hidden"
          : "hidden md:inline-flex"
      )}
      leftIcon={<span aria-hidden="true">⌘</span>}
      onClick={openDrawer}
      size={isFloating ? "md" : "sm"}
      variant="secondary"
    >
      <span className={cn(isFloating && "sr-only sm:not-sr-only")}>Hồ sơ phân tích</span>
    </Button>
  );
}
