import { z } from "zod";

export function isFieldRequired<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
  field: keyof TSchema["shape"],
): boolean {
  const fieldSchema = schema.shape[field as string];
  if (!fieldSchema) return false;

  return !(
    fieldSchema instanceof z.ZodOptional ||
    fieldSchema instanceof z.ZodNullable ||
    fieldSchema instanceof z.ZodDefault
  );
}

export function getRequiredFields<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
): Record<keyof TSchema["shape"], boolean> {
  const result = {} as Record<keyof TSchema["shape"], boolean>;

  for (const key of Object.keys(schema.shape) as (keyof TSchema["shape"])[]) {
    result[key] = isFieldRequired(schema, key);
  }

  return result;
}
