export type NavigationItem = {
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  href: string;
  group?: "Tổng quan" | "Chuẩn bị" | "Phân tích" | "Thực hành & quyết định";
  disabled?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    key: "overview",
    label: "Tổng quan",
    shortLabel: "Tổng",
    icon: "◇",
    href: "/overview",
    group: "Tổng quan",
  },
  {
    key: "learning",
    label: "Học tập",
    shortLabel: "Học",
    icon: "●",
    href: "/learning",
    group: "Chuẩn bị",
  },
  {
    key: "macro",
    label: "Vĩ mô",
    shortLabel: "Vĩ mô",
    icon: "◆",
    href: "/macro",
    group: "Phân tích",
  },
  {
    key: "industry",
    label: "Ngành",
    shortLabel: "Ngành",
    icon: "▤",
    href: "/industry",
    group: "Phân tích",
  },
  {
    key: "screening",
    label: "Lọc cổ phiếu",
    shortLabel: "Lọc",
    icon: "▽",
    href: "/screening",
    group: "Phân tích",
  },
  {
    key: "business",
    label: "Hiểu doanh nghiệp",
    shortLabel: "DN",
    icon: "▣",
    href: "/business",
    group: "Phân tích",
  },
  {
    key: "financials",
    label: "Báo cáo tài chính",
    shortLabel: "BCTC",
    icon: "▤",
    href: "/financials",
    group: "Phân tích",
  },
  {
    key: "valuation",
    label: "Định giá",
    shortLabel: "Giá",
    icon: "◇",
    href: "/valuation",
    group: "Phân tích",
  },
  {
    key: "risk",
    label: "Rủi ro & minh bạch",
    shortLabel: "RR",
    icon: "◉",
    href: "/risk",
    group: "Phân tích",
  },
  {
    key: "technical",
    label: "Price Volume Time",
    shortLabel: "PVT",
    icon: "⌁",
    href: "/technical",
    group: "Phân tích",
  },
  {
    key: "checklist",
    label: "Kiểm tra cổ phiếu",
    shortLabel: "KT",
    icon: "☷",
    href: "/checklist",
    group: "Thực hành & quyết định",
  },
  {
    key: "simulation",
    label: "Mô phỏng",
    shortLabel: "MP",
    icon: "○",
    href: "/simulation",
    group: "Thực hành & quyết định",
  },
  {
    key: "watchlist",
    label: "Watchlist",
    shortLabel: "WL",
    icon: "▧",
    href: "/watchlist",
    group: "Thực hành & quyết định",
  },
];
