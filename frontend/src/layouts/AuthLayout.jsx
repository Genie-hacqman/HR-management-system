export default function AuthLayout({ eyebrow, title, subtitle, children, wide = false }) {
  return (
    <div className="flex min-h-screen">
      {/* Signature panel — a running roster of what the platform tracks,
          standing in for the "org chart" every HR admin actually lives in. */}
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-navy-900 px-12 py-14 text-white lg:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm font-medium tracking-wide text-navy-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 font-display text-navy-900">H</span>
            HR SaaS
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-display text-3xl font-semibold leading-tight">
            One workspace for every company you run.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-navy-100/80">
            Departments, attendance, leave, payroll and performance —
            isolated per company, visible to the right people, and
            nothing else.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 text-xs text-navy-100/70">
          <div className="rounded-card border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-display text-lg text-white">4</p>
            <p>role types, fully scoped</p>
          </div>
          <div className="rounded-card border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-display text-lg text-white">1</p>
            <p>company per tenant, isolated data</p>
          </div>
        </div>

        {/* ambient shapes */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-navy-700/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">{eyebrow}</p>
          )}
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink/60">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
