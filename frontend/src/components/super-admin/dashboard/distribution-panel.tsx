export function DistributionPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ key: string; label: string; value: number; color: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No data available yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {items.map((item) => (
              <div
                key={item.key}
                title={`${item.label}: ${item.value}`}
                style={{
                  width: `${(item.value / total) * 100}%`,
                  backgroundColor: item.color,
                }}
                className="h-full transition-all"
              />
            ))}
          </div>

          <ul className="space-y-2.5">
            {items.map((item) => {
              const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);
              return (
                <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {item.value}{" "}
                    <span className="text-xs font-medium text-slate-400">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
