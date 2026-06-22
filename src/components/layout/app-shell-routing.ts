export function resolveActiveModule(
  moduleFromUrl: string | null,
  moduleKeys: Set<string>,
  defaultModuleKey: string
) {
  return moduleFromUrl && moduleKeys.has(moduleFromUrl) ? moduleFromUrl : defaultModuleKey;
}

export function readModuleFromLocation(search: string, hash: string) {
  const params = new URLSearchParams(search);
  const moduleFromHash = hash.replace(/^#/, "");
  return params.get("module") ?? (moduleFromHash || null);
}

export function buildModuleNavigationUrl(currentHref: string, nextModule: string) {
  const url = new URL(currentHref);
  url.searchParams.set("module", nextModule);
  return url;
}

export function shouldNormalizeInvalidModule(moduleFromUrl: string | null, moduleKeys: Set<string>) {
  return Boolean(moduleFromUrl && !moduleKeys.has(moduleFromUrl));
}
