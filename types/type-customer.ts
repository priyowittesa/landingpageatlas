export type CustomerCustomFieldValue = {
  value: string;
  label?: string;
};

export type CustomerTenantDto = {
  id: string;
  name: string;
};

export type CustomerDto = {
  id: string;
  tenant_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  email: string;
  custom_fields?: Record<string, CustomerCustomFieldValue>;
  tenant?: CustomerTenantDto;
};

export type CustomerFormDto = {
  full_name: string;
  age?: number;
  gender?: string;
  email: string;
  custom_fields?: Record<string, CustomerCustomFieldValue>;
};

export type CustomerFieldDto = {
  id: string;
  label: string;
  key: string;
  type: string;
  options?: string[];
  required?: boolean;
};

export type CustomerFieldFormDto = {
  label: string;
  key: string;
  type: string;
  options?: string[];
  required?: boolean;
};
