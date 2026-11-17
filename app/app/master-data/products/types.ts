export type ProductStatus = "active" | "inactive" | "obsolete" | "prototype";

export type Product = {
  id: string;
  partNumber: string;
  partName: string;
  revision: number;
  category: string;
  status: ProductStatus;
  createdAt?: string;
  createdBy?: string;
};

export const statusOptions: ProductStatus[] = [
  "active",
  "inactive",
  "obsolete",
  "prototype"
];

export const statusLabels: Record<ProductStatus, string> = {
  active: "Active",
  inactive: "In-Active",
  obsolete: "Obsolete",
  prototype: "Prototype"
};

export const OTHER_CATEGORY = "Other";

export const categoryOptions: string[] = [
  "Raw Material",
  "Sub-Component",
  "Sub-Assembly",
  "Finished Good"
];
