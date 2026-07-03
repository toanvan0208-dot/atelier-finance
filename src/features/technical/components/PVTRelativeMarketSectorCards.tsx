import type { PVTRelativeMarketSectorData } from "../types";

const formatValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "Chưa đủ dữ liệu";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const formatDiff = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "Chưa đủ dữ liệu";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)} điểm %`;
};

const toneClass = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "text-slate-500";
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-rose-700";
  return "text-slate-700";
};

export const PVTRelativeMarketSectorCards = ({
  data,
  ticker,
}: {
  data?: PVTRelativeMarketSectorData;
  ticker: string;
}) => {
  if (!data || !data.isComputable) return null;

  const isConsumerProxy = ticker === "MWG";
  const marketRows = [
    { label: ticker, values: [data.stockReturn5d, data.stockReturn20d, data.stockReturn60d], emphasis: true },
    { label: "VNINDEX", values: [data.vnindexReturn5d, data.vnindexReturn20d, data.vnindexReturn60d] },
    { label: "Lệch VNINDEX", values: [data.relativeToVNINDEX5d, data.relativeToVNINDEX20d, data.relativeToVNINDEX60d], diff: true },
    { label: "VN30", values: [data.vn30Return5d, data.vn30Return20d, data.vn30Return60d] },
    { label: "Lệch VN30", values: [data.relativeToVN305d, data.relativeToVN3020d, data.relativeToVN3060d], diff: true },
  ];
  const sectorRows = data.sectorProxySymbol
    ? [
        { label: ticker, values: [data.stockReturn5d, data.stockReturn20d, data.stockReturn60d], emphasis: true },
        {
          label: data.sectorProxySymbol,
          values: [data.sectorProxyReturn5d, data.sectorProxyReturn20d, data.sectorProxyReturn60d],
        },
        {
          label: `Lệch ${data.sectorProxySymbol}`,
          values: [data.relativeToSectorProxy5d, data.relativeToSectorProxy20d, data.relativeToSectorProxy60d],
          diff: true,
        },
      ]
    : [];

  return (
    <section className="space-y-4 rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Bối cảnh tương đối</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{ticker} đang đi khác thị trường ở đâu?</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            So sánh biến động cùng khung thời gian để biết cổ phiếu đang mạnh/yếu tương đối, rồi quay lại kiểm tra ngành,
            báo cáo tài chính, định giá và rủi ro.
          </p>
        </div>
        <div className="rounded-[8px] border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
          Dữ liệu tham khảo
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-2">
        <ComparisonTable title="So với thị trường chung" rows={marketRows} />
        {data.sectorProxySymbol ? (
          <ComparisonTable title={`So với chỉ số ngành (${data.sectorProxySymbol})`} rows={sectorRows} />
        ) : null}
      </div>

      {isConsumerProxy ? (
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          VNCONS là chỉ số tiêu dùng rộng, dùng để tham chiếu bối cảnh chung chứ không phải chỉ số bán lẻ chuyên biệt.
        </div>
      ) : null}
    </section>
  );
};

function ComparisonTable({
  rows,
  title,
}: {
  rows: Array<{ label: string; values: Array<number | null | undefined>; diff?: boolean; emphasis?: boolean }>;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.04em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Mốc so sánh</th>
              <th className="px-3 py-3 text-right">5 phiên</th>
              <th className="px-3 py-3 text-right">20 phiên</th>
              <th className="px-4 py-3 text-right">60 phiên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label} className={row.emphasis ? "bg-amber-50/70" : row.diff ? "bg-slate-50" : "bg-white"}>
                <td className="px-4 py-3 font-bold text-slate-950">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={`${row.label}-${index}`} className={`px-3 py-3 text-right font-bold ${toneClass(value)}`}>
                    {row.diff ? formatDiff(value) : formatValue(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
