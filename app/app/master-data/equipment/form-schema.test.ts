import { describe, expect, it } from "vitest";
import {
  EMPTY_EQUIPMENT_FORM,
  equipmentFormSchema,
  fromEquipmentApi,
  toEquipmentApiPayload,
  type EquipmentFormValues
} from "./form-schema";

const validValues: EquipmentFormValues = {
  ...EMPTY_EQUIPMENT_FORM,
  code: "EQ-001",
  name: "Excavator",
  category: "category-1",
  ownership_type: "Owned",
  owned_by: "company-1",
  country: "country-1",
  site_location: "Project Alpha",
  service_interval: "100",
  warning_threshold: "10"
};

function validationErrors(values: EquipmentFormValues) {
  const result = equipmentFormSchema.safeParse(values);
  expect(result.success).toBe(false);
  return result.error?.issues.map((issue) => ({
    field: issue.path[0], message: issue.message
  }));
}

describe("equipment ownership requirements", () => {
  it("requires explicit ownership selections when adding equipment", () => {
    expect(EMPTY_EQUIPMENT_FORM.owned_by).toBe("");
    expect(EMPTY_EQUIPMENT_FORM.ownership_type).toBe("");
    expect(validationErrors({
      ...validValues,
      owned_by: EMPTY_EQUIPMENT_FORM.owned_by,
      ownership_type: EMPTY_EQUIPMENT_FORM.ownership_type
    })).toEqual([
      { field: "ownership_type", message: "Ownership type is required." },
      { field: "owned_by", message: "Owned by is required." }
    ]);
  });

  it.each(["", "   "])("rejects an empty Owned By selection (%j)", (owned_by) => {
    expect(validationErrors({ ...validValues, owned_by })).toEqual([
      { field: "owned_by", message: "Owned by is required." }
    ]);
  });

  it.each(["", "   "])("rejects an empty Ownership Type selection (%j)", (ownership_type) => {
    expect(validationErrors({ ...validValues, ownership_type })).toEqual([
      { field: "ownership_type", message: "Ownership type is required." }
    ]);
  });

  it.each([undefined, null, ""])(
    "does not invent an ownership type when editing equipment with missing ownership (%j)",
    (ownership_type) => {
      const values = fromEquipmentApi({
        code: "EQ-001", name: "Excavator", category_id: "category-1",
        country: "country-1", site_location: "Project Alpha",
        service_interval: 100, warning_threshold: 10,
        ownership_type
      });
      expect(values.ownership_type).toBe("");
      expect(values.owned_by).toBe("");
      expect(validationErrors(values)).toEqual([
        { field: "ownership_type", message: "Ownership type is required." },
        { field: "owned_by", message: "Owned by is required." }
      ]);
    }
  );

  it.each(["Owned", "Rented", "Leased"])(
    "preserves valid %s ownership selections and their company ID",
    (ownership_type) => {
      const values = equipmentFormSchema.parse({ ...validValues, ownership_type });
      const payload = toEquipmentApiPayload(values);
      expect(payload.ownership_type).toBe(ownership_type);
      expect(payload.owned_by_company_id).toBe("company-1");
      const restored = fromEquipmentApi(payload);
      expect(restored.ownership_type).toBe(ownership_type);
      expect(restored.owned_by).toBe("company-1");
      expect(equipmentFormSchema.safeParse(restored).success).toBe(true);
    }
  );

  it("clears ownership errors once both selections are supplied", () => {
    expect(equipmentFormSchema.safeParse(validValues).success).toBe(true);
  });
});
