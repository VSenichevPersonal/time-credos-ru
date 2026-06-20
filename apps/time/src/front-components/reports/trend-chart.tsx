import { T } from 'src/front-components/reports/report-tokens';
import { fmtHrs, fmtUtil } from 'src/front-components/reports/report-tokens';
import { monthLabel } from 'src/front-components/reports/month-label';
import type { TimeseriesPoint } from 'src/front-components/reports/trend-types';

// Тренд утилизации по месяцам: парные столбцы «факт vs норма» + линия util %.
// Песочница-safe: чистый SVG/div через React, без canvas-libs и host-DOM.
// Столбцы — div (доступная высота через %), линия util — SVG-overlay поверх сетки.
// Перегруз (факт > норма) — терракот; факт ≤ нормы — учётный синий (accent).

type Props = { months: TimeseriesPoint[] };

// Геометрия линии util: точки в координатах 0..1 (x — центр месяца, y — снизу вверх).
// util=null (нет факта) рвёт линию на сегменты (не соединяем «провалом в 0»).
export type UtilSeg = { x: number; y: number }[];
export const utilSegments = (months: TimeseriesPoint[]): UtilSeg[] => {
  const n = months.length;
  if (n === 0) return [];
  const segs: UtilSeg[] = [];
  let cur: UtilSeg = [];
  months.forEach((m, i) => {
    if (m.util === null) {
      if (cur.length) segs.push(cur);
      cur = [];
      return;
    }
    const x = (i + 0.5) / n;
    const y = Math.min(1, Math.max(0, m.util)); // util клампим в 0..1 (>100% к потолку)
    cur.push({ x, y });
  });
  if (cur.length) segs.push(cur);
  return segs;
};

const CHART_H = 220; // высота области столбцов, px
const W = 1000; // viewBox-ширина SVG-оверлея (масштабируется по контейнеру)

export const TrendChart = ({ months }: Props) => {
  const peak = Math.max(1, ...months.map((m) => Math.max(m.fact, m.norm)));
  const segs = utilSegments(months);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        {/* Ось Y: подписи нормо-часов (3 деления) */}
        <div
          style={{
            width: 40,
            height: CHART_H,
            position: 'relative',
            flexShrink: 0,
            fontSize: 10.5,
            color: T.textFaint,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {[1, 0.5, 0].map((f) => (
            <div
              key={f}
              style={{
                position: 'absolute',
                right: 0,
                top: `${(1 - f) * 100}%`,
                transform: f === 1 ? 'none' : f === 0 ? 'translateY(-100%)' : 'translateY(-50%)',
              }}
            >
              {fmtHrs(peak * f)}
            </div>
          ))}
        </div>

        {/* Область столбцов + util-оверлей */}
        <div style={{ position: 'relative', flex: 1, height: CHART_H }}>
          {/* Горизонтальные гайды */}
          {[0, 0.5, 1].map((f) => (
            <div
              key={f}
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${f * 100}%`,
                borderTop: `1px ${f === 0 ? 'solid' : 'dashed'} ${T.border}`,
              }}
            />
          ))}

          {/* Столбцы по месяцам */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            {months.map((m) => {
              const over = m.fact > m.norm + 0.5;
              return (
                <div
                  key={m.month}
                  title={`${monthLabel(m.month, true)}: факт ${fmtHrs(m.fact)} ч · норма ${fmtHrs(m.norm)} ч · util ${fmtUtil(m.util)}`}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 3,
                    padding: '0 3px',
                  }}
                >
                  {/* Факт */}
                  <div
                    style={{
                      flex: 1,
                      maxWidth: 14,
                      height: `${(m.fact / peak) * 100}%`,
                      background: over ? T.over : T.accent,
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 200ms ease',
                    }}
                  />
                  {/* Норма (полая, нейтральная) */}
                  <div
                    style={{
                      flex: 1,
                      maxWidth: 14,
                      height: `${(m.norm / peak) * 100}%`,
                      background: T.headerBg,
                      border: `1px solid ${T.borderStrong}`,
                      borderBottom: 'none',
                      borderRadius: '3px 3px 0 0',
                      boxSizing: 'border-box',
                      transition: 'height 200ms ease',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Util %: линия + точки (SVG-оверлей, y снизу вверх) */}
          <svg
            aria-hidden
            viewBox={`0 0 ${W} ${CHART_H}`}
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            {segs.map((seg, i) => (
              <polyline
                key={i}
                fill="none"
                stroke={T.ok}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={seg.map((p) => `${p.x * W},${(1 - p.y) * CHART_H}`).join(' ')}
              />
            ))}
            {segs.flat().map((p, i) => (
              <circle
                key={i}
                cx={p.x * W}
                cy={(1 - p.y) * CHART_H}
                r={3}
                fill={T.surface}
                stroke={T.ok}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Ось X: подписи месяцев (год показываем у января и первой точки) */}
      <div style={{ display: 'flex', paddingLeft: 56 }}>
        {months.map((m, i) => (
          <div
            key={m.month}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10.5,
              color: T.textMuted,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {monthLabel(m.month, i === 0 || m.month.endsWith('-01'))}
          </div>
        ))}
      </div>
    </div>
  );
};
