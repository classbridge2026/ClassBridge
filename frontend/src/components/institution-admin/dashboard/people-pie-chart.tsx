export function PeoplePieChart({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ key: string; label: string; value: number; color: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const size = 160;
  const outer = 68;
  const inner = 40;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;
  const slices = items
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += item.value;
      const end = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      const largeArc = end - start > Math.PI ? 1 : 0;
      const ox1 = cx + outer * Math.cos(start);
      const oy1 = cy + outer * Math.sin(start);
      const ox2 = cx + outer * Math.cos(end);
      const oy2 = cy + outer * Math.sin(end);
      const ix1 = cx + inner * Math.cos(end);
      const iy1 = cy + inner * Math.sin(end);
      const ix2 = cx + inner * Math.cos(start);
      const iy2 = cy + inner * Math.sin(start);
      const path =
        total === item.value
          ? [
              `M ${cx} ${cy - outer}`,
              `A ${outer} ${outer} 0 1 1 ${cx - 0.01} ${cy - outer}`,
              `L ${cx - 0.01} ${cy - inner}`,
              `A ${inner} ${inner} 0 1 0 ${cx} ${cy - inner}`,
              "Z",
            ].join(" ")
          : [
              `M ${ox1} ${oy1}`,
              `A ${outer} ${outer} 0 ${largeArc} 1 ${ox2} ${oy2}`,
              `L ${ix1} ${iy1}`,
              `A ${inner} ${inner} 0 ${largeArc} 0 ${ix2} ${iy2}`,
              "Z",
            ].join(" ");
      return { ...item, path };
    });

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No people data yet.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <svg viewBox={`0 0 ${size} ${size}`} className="h-40 w-40" role="img" aria-label={title}>
              {slices.map((slice) => (
                <path key={slice.key} d={slice.path} fill={slice.color} stroke="#fff" strokeWidth="2" />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-bold tabular-nums text-slate-900">{total}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                People
              </p>
            </div>
          </div>

          <ul className="w-full space-y-2.5">
            {items.map((item) => {
              const pct = total ? Math.round((item.value / total) * 100) : 0;
              return (
                <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">
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
