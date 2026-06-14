export function resolveActiveModule(
  moduleFromUrl: string | null,
  moduleKeys: Set<string>,
  defaultModuleKey: string
) {
  return moduleFromUrl && moduleKeys.has(moduleFromUrl) ? moduleFromUrl : defaultModuleKey;
}

export function shouldNormalizeInvalidModule(moduleFromUrl: string | null, moduleKeys: Set<string>) {
  return Boolean(moduleFromUrl && !moduleKeys.has(moduleFromUrl));
}
