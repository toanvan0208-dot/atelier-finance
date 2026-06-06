export type NavigationItem = {
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  href: string;
  disabled?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    key: "self",
    label: "Hiểu bản thân",
    shortLabel: "Tôi",
    icon: "⌂",
    href: "/self",
  },
  {
    key: "macro",
    label: "Vĩ mô",
    shortLabel: "Vĩ mô",
    icon: "◈",
    href: "/macro",
  },
  {
    key: "industry",
    label: "Ngành",
    shortLabel: "Ngành",
    icon: "▤",
    href: "/industry",
  },
  {
    key: "screening",
    label: "Lọc cổ phiếu",
    shortLabel: "Lọc",
    icon: "▽",
    href: "/screening",
  },
  {
    key: "business",
    label: "Hiểu doanh nghiệp",
    shortLabel: "DN",
    icon: "▣",
    href: "/business",
  },
  {
    key: "financials",
    label: "Báo cáo tài chính",
    shortLabel: "BCTC",
    icon: "▤",
    href: "/financials",
  },
  {
    key: "valuation",
    label: "Định giá",
    shortLabel: "Giá",
    icon: "◇",
    href: "/valuation",
  },
  {
    key: "technical",
    label: "Price-Volume-Time",
    shortLabel: "PVT",
    icon: "⌁",
    href: "/technical",
  },
  {
    key: "risk",
    label: "Rủi ro & minh bạch",
    shortLabel: "RR",
    icon: "◉",
    href: "/risk",
  },
  {
    key: "checklist",
    label: "Checklist",
    shortLabel: "CL",
    icon: "☷",
    href: "/checklist",
  },
  {
    key: "watchlist",
    label: "Watchlist",
    shortLabel: "WL",
    icon: "▧",
    href: "/watchlist",
  },
  {
    key: "simulation",
    label: "Mô phỏng",
    shortLabel: "MP",
    icon: "◌",
    href: "/simulation",
  },
  {
    key: "journal",
    label: "Nhật ký",
    shortLabel: "NK",
    icon: "□",
    href: "/journal",
  },
];
