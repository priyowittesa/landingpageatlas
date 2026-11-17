export type ProductStatus = "Active" | "In-Active" | "Obsolete" | "Prototype";

export type ProductCategory =
  | "Raw Material"
  | "Sub-Component"
  | "Sub-Assembly"
  | "Finished Good";

export type InspectionProduct = {
  id: string;
  partNumber: string;
  partName: string;
  revision: string;
  category: ProductCategory;
  status: ProductStatus;
  drawings: string;
};

export const productCategories: ProductCategory[] = [
  "Raw Material",
  "Sub-Component",
  "Sub-Assembly",
  "Finished Good"
];

export const productStatuses: ProductStatus[] = [
  "Active",
  "In-Active",
  "Obsolete",
  "Prototype"
];

export const initialProducts: InspectionProduct[] = [
  { id: "1", partNumber: "BRK-A100", partName: "Bracket A-100", revision: "Rev C", category: "Sub-Component", status: "Active", drawings: "DWG-4471-C" },
  { id: "2", partNumber: "HSG-B220", partName: "Housing B-220", revision: "Rev B", category: "Sub-Assembly", status: "Active", drawings: "DWG-5820-B" },
  { id: "3", partNumber: "VLV-C30", partName: "Valve Assembly C-30", revision: "Rev A", category: "Finished Good", status: "Active", drawings: "DWG-6103-A" },
  { id: "4", partNumber: "PLT-D410", partName: "Mounting Plate D-410", revision: "Rev B", category: "Raw Material", status: "Prototype", drawings: "DWG-7290-B" }
];
