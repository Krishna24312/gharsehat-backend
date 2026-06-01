import type { ReactNode } from "react";
import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";

export function RoleSelect() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-stone-800">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pt-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-stone-900">
            Ghar<span className="text-brand">Sehat</span>
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="hidden rounded-full border border-stone-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-500 sm:inline-flex">
            Demo mode
          </span>
          <div className="max-w-[11rem] overflow-hidden">
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
        <section className="mx-auto max-w-2xl text-center sm:mx-0 sm:text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
            Welcome to GharSehat
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Recovering from a burn at home?
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">
            AI companion for burn-wound recovery at home, with daily check-ins,
            gentle guidance, and a quiet review portal for clinicians.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-card">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />
            <span className="text-xs text-stone-500">
              Tracks visual change between photos.
            </span>
          </div>
        </section>

        <section className="mt-8 sm:mt-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
            Choose your role
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard
              to="/home"
              tone="primary"
              icon={<HeartPulse className="h-6 w-6" />}
              eyebrow="At home"
              title="Patient"
              subtitle="Daily check-in, symptoms, dressing guide, progress"
              cta="Continue as patient"
            />
            <RoleCard
              to="/doctor"
              tone="neutral"
              icon={<Stethoscope className="h-6 w-6" />}
              eyebrow="Clinician"
              title="Doctor"
              subtitle="Silent triage review of caregiver check-ins"
              cta="Open doctor portal"
            />
          </div>
        </section>

        <footer className="mt-auto pt-10 text-center text-[11px] leading-relaxed text-stone-500">
          GharSehat tracks visual change between photos. It does not diagnose,
          and the doctor portal updates quietly for review.
        </footer>
      </main>
    </div>
  );
}

function RoleCard({
  to,
  tone,
  icon,
  eyebrow,
  title,
  subtitle,
  cta,
}: {
  to: string;
  tone: "primary" | "neutral";
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
  cta: string;
}) {
  const isPrimary = tone === "primary";
  return (
    <Link
      to={to}
      className={`group relative flex min-h-[15rem] flex-col rounded-2xl border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:p-6 ${
        isPrimary
          ? "border-brand/30 bg-white hover:border-brand/50"
          : "border-stone-100 bg-white hover:border-stone-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
            isPrimary ? "bg-brand text-white" : "bg-stone-100 text-stone-700"
          }`}
        >
          {icon}
        </span>
        {eyebrow && (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">
            {eyebrow}
          </span>
        )}
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{subtitle}</p>
      <div
        className={`mt-auto inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
          isPrimary
            ? "bg-brand text-white group-hover:bg-brand-dark"
            : "bg-stone-900 text-white group-hover:bg-stone-800"
        }`}
      >
        <span>{cta}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
