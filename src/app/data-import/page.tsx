import { ManualDataImportWorkspace } from "@/components/data-import";
import { isLocalImportsEnabled } from "@/lib/config/local-imports-access";

export default function DataImportPage() {
  const localImportsEnabled = isLocalImportsEnabled();
  return <ManualDataImportWorkspace localImportsEnabled={localImportsEnabled} />;
}
