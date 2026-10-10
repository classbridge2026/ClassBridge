function maxCount(values: number[]) {
  return Math.max(1, ...values);
}

export function GrowthChart({
  title,
  description,
  series,
  color = "#2563EB",
}: {
  title: string;
  description: string;
  series: Array<{ label: string; count: number }>;
  color?: string;
}) {
  const max = maxCount(series.map((item) => item.count));
  const width = 320;
  const height = 140;
  const padding = 16;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = series.map((item, index) => {
    const x =
      series.length === 1
        ? padding + chartWidth / 2
        : padding + (index / (series.length - 1)) * chartWidth;
    const y = padding + chartHeight - (item.count / max) * chartHeight;
    return { ...item, x, y };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padding} ${padding + chartHeight} L ${points[0]?.x ?? padding} ${padding + chartHeight} Z`;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {series.every((item) => item.count === 0) ? (
        <p className="py-10 text-center text-sm text-slate-500">No growth data in this period.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label={title}>
            <defs>
              <linearGradient id={`fill-${title.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#fill-${title.replace(/\s+/g, "-")})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            {points.map((point) => (
              <circle key={point.label} cx={point.x} cy={point.y} r="3.5" fill={color} />
            ))}
          </svg>
          <div className="mt-2 flex justify-between gap-2">
            {series.map((item) => (
              <div key={item.label} className="min-w-0 flex-1 text-center">
                <p className="truncate text-[11px] font-semibold text-slate-500">{item.label}</p>
                <p className="text-xs font-bold text-slate-800">{item.count}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
