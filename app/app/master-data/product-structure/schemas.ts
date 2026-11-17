import { z } from "zod";

export const statusSchema = z
  .enum(["Active", "Draft", "Inactive"], {
    message: "Status is required",
  })
  .refine((val) => val !== undefined, { message: "Status is required" });

const requiredText = (label: string, max = 100) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

const requiredCode = (label: string, max = 30) =>
  requiredText(label, max).regex(
    /^[A-Za-z0-9-_]+$/,
    `${label} can only contain letters, numbers, "-" and "_"`,
  );

const requiredPositiveNumber = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .min(0, `${label} must be at least 0`);

const requiredPercentage = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(0, `${label} must be at least 0`)
    .max(100, `${label} cannot exceed 100`);

export const addProductSchema = z.object({
  productCode: requiredText("Product Code"),
  productName: requiredText("Product Name"),
  status: statusSchema,
});

export type AddProductFormValues = z.infer<typeof addProductSchema>;

export const addGroupSchema = z.object({
  groupCode: requiredText("Group Code"),
  groupName: requiredText("Group Name"),
  productionLines: requiredPositiveNumber("Production Lines"),
  status: statusSchema,
});

export type AddGroupFormValues = z.infer<typeof addGroupSchema>;

export const addLinesSchema = z.object({
  lineCode: requiredCode("Line Code"),
  lineName: requiredText("Line Name"),
  efficiency: requiredPositiveNumber("Efficiency"),
  status: statusSchema,
});

export type AddLinesFormValues = z.infer<typeof addLinesSchema>;

export const addPartSchema = z.object({
  partNumber: requiredText("Part Number"),
  partName: requiredText("Part Name"),
  backNumber: requiredText("Back Number"),
  model: requiredText("Model"),
  cycleTime: requiredPositiveNumber("Cycle Time"),
  spm: requiredPositiveNumber("Spm"),
  status: statusSchema,
});

export type AddPartFormValues = z.infer<typeof addPartSchema>;

export const addAssemblyPartSchema = z.object({
  partNumber: requiredCode("Part Number"),
  partName: requiredText("Part Name"),
  usage: requiredPositiveNumber("Usage"),
  status: statusSchema,
});

export type AddAssemblyPartFormValues = z.infer<typeof addAssemblyPartSchema>;

export const productStructureFormSchemas = {
  product: addProductSchema,
  group: addGroupSchema,
  lines: addLinesSchema,
  part: addPartSchema,
  assemblyPart: addAssemblyPartSchema,
} as const;
