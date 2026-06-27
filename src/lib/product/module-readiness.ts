export type ProductModuleReadiness =
  | "available_real_read_path"
  | "available_editorial_static"
  | "gated_not_real_yet"
  | "unsupported";

export type ProductModuleGate = {
  module: string;
  readiness: ProductModuleReadiness;
  reason: string;
  userFacingLabel: string;
};

export const PRODUCT_MODULE_GATES: Record<string, ProductModuleGate> = {
  simulation: {
    module: "simulation",
    readiness: "gated_not_real_yet",
    reason: "Chức năng mô phỏng chưa khả dụng trong bản sản phẩm thật vì cần tài khoản người dùng và luồng lưu giao dịch mô phỏng.",
    userFacingLabel: "Mô phỏng",
  },
  watchlist: {
    module: "watchlist",
    readiness: "gated_not_real_yet",
    reason: "Chức năng theo dõi cổ phiếu chưa khả dụng trong bản sản phẩm thật vì cần tài khoản người dùng.",
    userFacingLabel: "Watchlist",
  },
  learning: {
    module: "learning",
    readiness: "available_editorial_static",
    reason: "Nội dung giáo dục nền tảng",
    userFacingLabel: "Học tập",
  },
};
