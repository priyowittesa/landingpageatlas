import { z } from "zod";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";

const axios = axiosConfig(env.apiBaseUrl);
const CONNECTION_URL = "/v1/portal/connection";
const namedItemSchema = z.object({ name: z.string().min(1) });
const namesResponseSchema = z.object({ items: z.array(namedItemSchema) });
const tablesResponseSchema = z.object({
  items: z.array(namedItemSchema.extend({ schema_name: z.string().optional() }))
});

export type CatalogName = z.infer<typeof namedItemSchema>;

export async function fetchConnectionDatabases(): Promise<CatalogName[]> {
  const response = await axios.get(`${CONNECTION_URL}/databases`);
  return namesResponseSchema.parse(response.data).items;
}

export async function fetchConnectionSchemas(databaseName: string): Promise<CatalogName[]> {
  const response = await axios.get(`${CONNECTION_URL}/schemas`, {
    params: { database_name: databaseName }
  });
  return namesResponseSchema.parse(response.data).items;
}

export async function fetchConnectionTables(databaseName: string, schemaName: string): Promise<CatalogName[]> {
  const response = await axios.get(`${CONNECTION_URL}/tables`, {
    params: { database_name: databaseName, schema_name: schemaName }
  });
  const { items } = tablesResponseSchema.parse(response.data);
  if (items.some((table) => table.schema_name !== undefined && table.schema_name !== schemaName)) {
    throw new Error("The table catalog returned a different schema.");
  }
  return items.map(({ name }) => ({ name }));
}
