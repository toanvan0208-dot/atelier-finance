import { ResetPasswordPanel } from "@/features/auth/ResetPasswordPanel";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950">
      <ResetPasswordPanel token={firstParam(params.token)} />
    </main>
  );
}
