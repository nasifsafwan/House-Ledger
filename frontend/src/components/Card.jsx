export default function Card({ title, subtitle, icon, children, className = "" }) {
  return (
    <div className={`w-full rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {(title || icon) ? (
        <div className="mb-5 flex items-center gap-3">
          {icon ? <span className="text-2xl">{icon}</span> : null}
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2> : null}
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}