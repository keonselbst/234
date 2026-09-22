export function PageHeader({ title, subtitle, eyebrow, actions, testId }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6 flex-wrap" data-testid={testId}>
      <div>
        {eyebrow && <div className="label-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-white/50 mt-1 text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className = "", testId }) {
  return (
    <div className={`glass rounded-3xl p-6 ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default", icon: Icon, testId }) {
  const tones = {
    default: "text-white",
    orange: "text-[#FF5722]",
    yellow: "text-[#E1FF00]",
    green: "text-emerald-400",
    red: "text-red-400",
  };
  return (
    <div className="glass rounded-3xl p-5 flex flex-col justify-between min-h-[120px]" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="label-eyebrow">{label}</div>
        {Icon && <Icon className={`w-5 h-5 ${tones[tone]} opacity-80`} strokeWidth={2} />}
      </div>
      <div className="mt-4">
        <div className={`text-3xl font-heading font-extrabold tracking-tight ${tones[tone]}`}>{value}</div>
        {hint && <div className="text-[11px] text-white/40 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

export function Empty({ text = "Нет данных" }) {
  return <div className="text-white/40 text-sm text-center py-12">{text}</div>;
}
