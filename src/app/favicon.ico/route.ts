const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f172a"/>
  <path d="M18 43 31 15l15 28h-7l-3-7H25l-3 7h-4Zm10-13h6l-3-7-3 7Z" fill="#f8fafc"/>
</svg>`;

export const GET = (): Response =>
  new Response(faviconSvg, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
