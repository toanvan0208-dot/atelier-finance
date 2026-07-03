import React from "react";
import type { PVTRelativeMarketSectorData } from "../types";

const formatValue = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "Chưa đủ dữ liệu khớp ngày";
  return `${val > 0 ? "+" : ""}${val.toFixed(2)}`;
};

const formatDiff = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "Chưa đủ dữ liệu khớp ngày";
  return `${val > 0 ? "+" : ""}${val.toFixed(2)} điểm phần trăm`;
};

export const PVTRelativeMarketSectorCards = ({
  data,
  ticker
}: {
  data?: PVTRelativeMarketSectorData;
  ticker: string;
}) => {
  if (!data || !data.isComputable) {
    return null;
  }

  const isConsumerProxy = ticker === "MWG";

  return (
    <section className="mt-8 space-y-4 rounded-lg border border-ink/10 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-ink">So sánh với thị trường và chỉ số ngành tham chiếu</h2>
        <p className="mt-1 text-sm text-subtle">
          Phần này so sánh biến động giá của cổ phiếu với VNINDEX, VN30 và chỉ số ngành tham chiếu trong cùng khoảng thời gian. Đây là dữ liệu quan sát, không phải tín hiệu giao dịch.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Market Comparison Card */}
        <div className="rounded border border-ink/10 p-4">
          <h3 className="mb-4 font-bold text-ink">Thị trường chung (VNINDEX & VN30)</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-subtle">
                <tr>
                  <th className="py-2 font-normal">Chỉ số</th>
                  <th className="py-2 font-normal text-right">5 phiên</th>
                  <th className="py-2 font-normal text-right">20 phiên</th>
                  <th className="py-2 font-normal text-right">60 phiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr>
                  <td className="py-3 font-medium text-ink">Cổ phiếu</td>
                  <td className="py-3 text-right">{formatValue(data.stockReturn5d)}%</td>
                  <td className="py-3 text-right">{formatValue(data.stockReturn20d)}%</td>
                  <td className="py-3 text-right">{formatValue(data.stockReturn60d)}%</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-ink">VNINDEX</td>
                  <td className="py-3 text-right">{formatValue(data.vnindexReturn5d)}%</td>
                  <td className="py-3 text-right">{formatValue(data.vnindexReturn20d)}%</td>
                  <td className="py-3 text-right">{formatValue(data.vnindexReturn60d)}%</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3 pl-2 text-subtle">Chênh lệch so với VNINDEX</td>
                  <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToVNINDEX5d)}</td>
                  <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToVNINDEX20d)}</td>
                  <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToVNINDEX60d)}</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-ink">VN30</td>
                  <td className="py-3 text-right">{formatValue(data.vn30Return5d)}%</td>
                  <td className="py-3 text-right">{formatValue(data.vn30Return20d)}%</td>
                  <td className="py-3 text-right">{formatValue(data.vn30Return60d)}%</td>
                </tr>
                <tr className="bg-muted/5">
                  <td className="py-3 pl-2 text-subtle">Chênh lệch so với VN30</td>
                  <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToVN305d)}</td>
                  <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToVN3020d)}</td>
                  <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToVN3060d)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Proxy Comparison Card */}
        {data.sectorProxySymbol && (
          <div className="rounded border border-ink/10 p-4">
            <h3 className="mb-4 font-bold text-ink">Chỉ số ngành tham chiếu ({data.sectorProxySymbol})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-subtle">
                  <tr>
                    <th className="py-2 font-normal">Chỉ số</th>
                    <th className="py-2 font-normal text-right">5 phiên</th>
                    <th className="py-2 font-normal text-right">20 phiên</th>
                    <th className="py-2 font-normal text-right">60 phiên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  <tr>
                    <td className="py-3 font-medium text-ink">Cổ phiếu</td>
                    <td className="py-3 text-right">{formatValue(data.stockReturn5d)}%</td>
                    <td className="py-3 text-right">{formatValue(data.stockReturn20d)}%</td>
                    <td className="py-3 text-right">{formatValue(data.stockReturn60d)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-ink">{data.sectorProxySymbol}</td>
                    <td className="py-3 text-right">{formatValue(data.sectorProxyReturn5d)}%</td>
                    <td className="py-3 text-right">{formatValue(data.sectorProxyReturn20d)}%</td>
                    <td className="py-3 text-right">{formatValue(data.sectorProxyReturn60d)}%</td>
                  </tr>
                  <tr className="bg-muted/5">
                    <td className="py-3 pl-2 text-subtle">Chênh lệch so với chỉ số ngành tham chiếu</td>
                    <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToSectorProxy5d)}</td>
                    <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToSectorProxy20d)}</td>
                    <td className="py-3 pr-2 text-right text-subtle">{formatDiff(data.relativeToSectorProxy60d)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded bg-muted/10 p-3 text-xs text-subtle">
              <p>Chỉ số ngành tham chiếu rộng, không phải đánh giá thứ bậc ngành.</p>
              {isConsumerProxy && (
                <p className="mt-1">VNCONS là chỉ số tiêu dùng rộng, không phải chỉ số bán lẻ chuyên biệt.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-ink/10 pt-4 text-xs text-subtle">
        <ul className="list-inside list-disc space-y-1">
          <li>Dữ liệu nghiên cứu, chưa phê duyệt sản xuất.</li>
          <li>Cần đối chiếu thêm với mô hình kinh doanh, báo cáo tài chính, định giá và rủi ro.</li>
          <li>Không phải tín hiệu giao dịch.</li>
        </ul>
      </div>
    </section>
  );
};
