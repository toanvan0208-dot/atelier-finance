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
    href: "/workspace?module=overview",
    group: "Tổng quan",
  },
  {
    key: "learning",
    label: "Học tập",
    shortLabel: "Học",
    icon: "●",
    href: "/workspace?module=learning",
    group: "Chuẩn bị",
  },
  {
    key: "macro",
    label: "Vĩ mô",
    shortLabel: "Vĩ mô",
    icon: "◆",
    href: "/workspace?module=macro",
    group: "Phân tích",
  },
  {
    key: "industry",
    label: "Ngành",
    shortLabel: "Ngành",
    icon: "▤",
    href: "/workspace?module=industry",
    group: "Phân tích",
  },
  {
    key: "screening",
    label: "Lọc cổ phiếu",
    shortLabel: "Lọc",
    icon: "▽",
    href: "/workspace?module=screening",
    group: "Phân tích",
  },
  {
    key: "business",
    label: "Hiểu doanh nghiệp",
    shortLabel: "DN",
    icon: "▣",
    href: "/workspace?module=business",
    group: "Phân tích",
  },
  {
    key: "financials",
    label: "Báo cáo tài chính",
    shortLabel: "BCTC",
    icon: "▤",
    href: "/workspace?module=financials",
    group: "Phân tích",
  },
  {
    key: "valuation",
    label: "Định giá",
    shortLabel: "Giá",
    icon: "◇",
    href: "/workspace?module=valuation",
    group: "Phân tích",
  },
  {
    key: "risk",
    label: "Rủi ro & minh bạch",
    shortLabel: "RR",
    icon: "◉",
    href: "/workspace?module=risk",
    group: "Phân tích",
  },
  {
    key: "technical",
    label: "Quan sát Giá - Thanh khoản - Thời điểm",
    shortLabel: "PVT",
    icon: "⌁",
    href: "/workspace?module=technical",
    group: "Phân tích",
  },
  {
    key: "checklist",
    label: "Kiểm tra & luyện tư duy",
    shortLabel: "KT",
    icon: "☷",
    href: "/workspace?module=checklist",
    group: "Thực hành & quyết định",
  },
  {
    key: "simulation",
    label: "Mô phỏng",
    shortLabel: "MP",
    icon: "○",
    href: "/workspace?module=simulation",
    group: "Thực hành & quyết định",
  },
  {
    key: "watchlist",
    label: "Watchlist",
    shortLabel: "WL",
    icon: "▧",
    href: "/workspace?module=watchlist",
    group: "Thực hành & quyết định",
  },
];
