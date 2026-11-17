"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleCheck,
  Gauge,
  ImageIcon,
  Info,
  MapPin,
  Plus,
  Save,
  Settings,
  UploadCloud,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister
} from "react-hook-form";

import LazySelect from "@/components/LazySelect";
import FormDateField from "@/components/FormDateField";
import FormFieldLayout from "@/components/FormFieldLayout";
import FormSection from "@/components/FormSection";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  CONDITION_OPTIONS,
  CURRENCY_OPTIONS,
  EMPTY_EQUIPMENT_FORM,
  FUEL_TYPE_OPTIONS,
  MANUFACTURE_YEAR_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
  SITE_LOCATION_OPTIONS,
  STATUS_OPTIONS,
  equipmentFormSchema,
  type EquipmentFormValues
} from "../form-schema";
import {
  useCities,
  useCountries,
  useStates,
} from "../use-locations";
import { mergeLocationItems } from "../location-options";
import {
  useCompanies,
  useDeleteEquipmentImage,
  useDepartments,
  useEquipmentCategories,
  useEquipmentTypeClasses,
  useFrequencyTypeOption,
  useFrequencyTypeOptions,
  useProjects,
  useUnitsOfMeasure,
  type FrequencyTypeRefOption,
} from "../use-equipment";
import type { EquipmentImage } from "../use-equipment";
import AddCompanyDialog from "@/components/quick-add/AddCompanyDialog";
import AddDepartmentDialog from "@/components/quick-add/AddDepartmentDialog";
import AddEquipmentCategoryDialog from "@/components/quick-add/AddEquipmentCategoryDialog";
import AddEquipmentTypeClassDialog from "@/components/quick-add/AddEquipmentTypeClassDialog";
import AddProjectDialog from "@/components/quick-add/AddProjectDialog";
import AddUnitOfMeasureDialog from "@/components/quick-add/AddUnitOfMeasureDialog";
import type { RefOption } from "@/hooks/useConstructionRefs";

type QuickAddType =
  | "category"
  | "type_class"
  | "unit"
  | "company"
  | "department"
  | "project";
type QuickAddTarget = { type: QuickAddType; field: keyof EquipmentFormValues };

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function isAcceptedImage(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    ACCEPTED_IMAGE_TYPES.includes(file.type) ||
    ACCEPTED_EXTENSIONS.includes(ext)
  );
}

export type ImageUploadStatus =
  | "idle"
  | "getting-upload-url"
  | "uploading-s3"
  | "registering"
  | "success"
  | "error";

export interface ImageEntry {
  file: File;
  url: string;
  uploadStatus: ImageUploadStatus;
  uploadError?: string;
  storageKey?: string;
}

interface EquipmentFormProps {
  isEdit?: boolean;
  title: string;
  description: string;
  initialValues?: EquipmentFormValues;
  existingImages?: EquipmentImage[];
  equipmentId?: string;
  pending?: boolean;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (
    values: EquipmentFormValues,
    images: File[],
    uploadStatuses: ImageUploadStatus[],
    setUploadStatus: (
      index: number,
      update: Partial<Omit<ImageEntry, "file" | "url">>
    ) => void
  ) => void | Promise<void>;
}

type Option = { label: string; value: string };

type EquipmentControl = Control<
  EquipmentFormValues,
  unknown,
  EquipmentFormValues
>;

export function EquipmentForm({
  isEdit = false,
  title,
  description,
  initialValues = EMPTY_EQUIPMENT_FORM,
  existingImages = [],
  equipmentId = "",
  pending = false,
  submitLabel = "Save Equipment",
  onCancel,
  onSubmit
}: EquipmentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: initialValues
  });

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [quickAdd, setQuickAdd] = useState<QuickAddTarget | null>(null);
  const [selectedFrequency, setSelectedFrequency] =
    useState<FrequencyTypeRefOption | null>(null);

  const openQuickAdd = (type: QuickAddType, field: keyof EquipmentFormValues) =>
    setQuickAdd({ type, field });

  const handleCreated = (option: RefOption) => {
    if (quickAdd) {
      setValue(quickAdd.field, option.value, { shouldValidate: true });
    }
    setQuickAdd(null);
  };

  const categories = useEquipmentCategories();
  const categoryValue = useWatch({ control, name: "category" });
  const typeClasses = useEquipmentTypeClasses(categoryValue || undefined);
  const units = useUnitsOfMeasure();
  const departments = useDepartments();
  const companies = useCompanies();
  const projects = useProjects();

  const withLoading = (placeholder: string, isLoading: boolean) =>
    isLoading ? "Loading..." : placeholder;

  const applyFrequencyType = useCallback((option: FrequencyTypeRefOption | null) => {
    setSelectedFrequency(option);
    if (option?.valueType.trim().toLowerCase() === "date" && option.daysPerUnit > 0) {
      setValue("service_interval", String(option.daysPerUnit), {
        shouldValidate: true,
      });
    }
  }, [setValue]);

  useEffect(() => reset(initialValues), [initialValues, reset]);
  useEffect(
    () => () => images.forEach((image) => URL.revokeObjectURL(image.url)),
    [images]
  );

  const descriptionValue = useWatch({ control, name: "description" });
  const addressValue = useWatch({ control, name: "detailed_address" });
  const currentCountryId = useWatch({ control, name: "country" });
  const currentStateId = useWatch({ control, name: "state_province" });

  // Cascading location fields: clear child when parent changes.
  // Start with the form's current values so edit-mode defaults are not treated
  // as a user changing the parent select on the first render.
  const prevCountryRef = useRef<string | undefined>(currentCountryId);
  const prevStateRef = useRef<string | undefined>(currentStateId);
  useEffect(() => {
    if (prevCountryRef.current !== currentCountryId) {
      prevCountryRef.current = currentCountryId;
      setValue("state_province", "", { shouldValidate: false });
      setValue("city_region", "", { shouldValidate: false });
    }
  }, [currentCountryId, setValue]);
  useEffect(() => {
    if (prevStateRef.current !== currentStateId) {
      prevStateRef.current = currentStateId;
      setValue("city_region", "", { shouldValidate: false });
    }
  }, [currentStateId, setValue]);

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;
    setImages((prev) => {
      const accepted = Array.from(files)
        .filter(
          (file) =>
            isAcceptedImage(file) &&
            file.size > 0 &&
            file.size <= MAX_IMAGE_SIZE
        )
        .slice(0, MAX_IMAGES - prev.length)
        .map((file) => ({
          file,
          url: URL.createObjectURL(file),
          uploadStatus: "idle" as ImageUploadStatus
        }));
      return [...prev, ...accepted];
    });
  }, []);

  const removeImage = (index: number) =>
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });

  const setImageUploadStatus = (
    index: number,
    update: Partial<Omit<ImageEntry, "file" | "url">>
  ) =>
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...update };
      return next;
    });

  const submit = handleSubmit((values) =>
    onSubmit(
      values,
      images.map((image) => image.file),
      images.map((image) => image.uploadStatus),
      setImageUploadStatus
    )
  );

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title={title} subtitle={description} />

      <form onSubmit={submit} className="space-y-5">
        <FormSection
          icon={Info}
          title="Basic Information"
          subtitle="Provide the general information about the equipment."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Equipment Code"
              name="code"
              register={register}
              error={errors.code?.message}
              required={!isEdit}
              disabled={isEdit}
              placeholder="Enter equipment code"
              desc="Unique code to identify this equipment"
            />
            <TextField
              label="Equipment Name"
              name="name"
              register={register}
              error={errors.name?.message}
              required
              placeholder="Enter equipment name"
              desc="Full name of the equipment"
            />
            <SelectField
              label="Category"
              name="category"
              control={control}
              error={errors.category?.message}
              required
              placeholder={withLoading("Select category", categories.isLoading)}
              options={categories.data ?? []}
              onAddNew={() => openQuickAdd("category", "category")}
            />
            <SelectField
              label="Type / Class"
              name="type_class"
              control={control}
              placeholder={
                categoryValue
                  ? withLoading("Select type / class", typeClasses.isLoading)
                  : "Select a category first"
              }
              options={typeClasses.data ?? []}
              onAddNew={() => openQuickAdd("type_class", "type_class")}
            />
            <TextField
              label="Brand / Manufacturer"
              name="brand"
              register={register}
              placeholder="Enter brand or manufacturer"
            />
            <TextField
              label="Model"
              name="model"
              register={register}
              placeholder="Enter model"
            />
            <TextField
              label="Serial Number / VIN"
              name="serial_number"
              register={register}
              placeholder="Enter serial number"
            />
            <div className="hidden md:block" />
            <TextareaField
              label="Description"
              name="description"
              register={register}
              maxLength={500}
              count={descriptionValue?.length ?? 0}
              placeholder="Enter description"
              className="md:col-span-2"
            />
          </div>
        </FormSection>

        <FormSection
          icon={Settings}
          title="Specifications"
          subtitle="Provide the technical specifications and capacity details."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Specification"
              name="specification"
              register={register}
              placeholder="Enter specification"
            />
            <SelectField
              label="Manufacture Year"
              name="manufacture_year"
              control={control}
              placeholder="Select year"
              options={MANUFACTURE_YEAR_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField
              label="Capacity / Size"
              name="capacity_size"
              register={register}
              placeholder="Enter capacity or size"
            />
            <SelectField
              label="Unit"
              name="capacity_unit"
              control={control}
              placeholder={withLoading("Select unit", units.isLoading)}
              options={units.data ?? []}
              onAddNew={() => openQuickAdd("unit", "capacity_unit")}
            />
            <SelectField
              label="Fuel Type"
              name="fuel_type"
              control={control}
              placeholder="Select fuel type"
              options={FUEL_TYPE_OPTIONS}
            />
            <TextField
              label="Operating Weight"
              name="operating_weight"
              register={register}
              placeholder="Enter operating weight"
            />
          </div>
        </FormSection>

        <FormSection
          icon={MapPin}
          title="Ownership & Location"
          subtitle="Provide ownership details and where the equipment is located."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Ownership Type"
              name="ownership_type"
              control={control}
              error={errors.ownership_type?.message}
              required
              placeholder="Select ownership type"
              options={OWNERSHIP_TYPE_OPTIONS}
            />
            <SelectField
              label="Owned By"
              name="owned_by"
              control={control}
              error={errors.owned_by?.message}
              required
              placeholder={withLoading("Select owner", companies.isLoading)}
              options={companies.data ?? []}
              onAddNew={() => openQuickAdd("company", "owned_by")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormDateField
              label="Purchase Date"
              name="purchase_date"
              control={control}
              error={errors.purchase_date}
              placeholder="Select purchase date"
            />
            <FormFieldLayout label="Purchase Price" htmlFor="purchase_price">
              <div className="flex gap-2">
                <Input
                  id="purchase_price"
                  type="number"
                  min={0}
                  placeholder="Enter purchase price"
                  className="h-10 rounded-sm"
                  {...register("purchase_price")}
                />
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-24 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </FormFieldLayout>
            <TextField
              label="Supplier / Vendor"
              name="supplier"
              register={register}
              placeholder="Enter supplier or vendor"
            />
            <TextField
              label="Invoice / Document No."
              name="invoice_no"
              register={register}
              placeholder="Enter invoice or document number"
            />
            <FormDateField
              label="Warranty Start Date"
              name="warranty_start"
              control={control}
              error={errors.warranty_start}
              placeholder="Select start date"
            />
            <FormDateField
              label="Warranty End Date"
              name="warranty_end"
              control={control}
              error={errors.warranty_end}
              placeholder="Select end date"
            />
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-semibold text-gray-800">
              Location Information
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <CountryField
                  label="Country"
                  name="country"
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  required
                  error={errors.country?.message}
                />
              )}
            />
            <Controller
              name="state_province"
              control={control}
              render={({ field }) => (
                <StateField
                  label="State / Province"
                  name="state_province"
                  countryId={currentCountryId}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
            <Controller
              name="city_region"
              control={control}
              render={({ field }) => (
                <CityField
                  label="City / Region"
                  name="city_region"
                  stateId={currentStateId}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
            <SelectField
              label="Site / Location"
              name="site_location"
              control={control}
              error={errors.site_location?.message}
              required
              placeholder="Select site / location"
              options={SITE_LOCATION_OPTIONS}
            />
            <SelectField
              label="Department / Cost Center"
              name="department"
              control={control}
              placeholder={withLoading(
                "Select department / cost center",
                departments.isLoading
              )}
              options={departments.data ?? []}
              onAddNew={() => openQuickAdd("department", "department")}
            />
            <SelectField
              label="Project (Optional)"
              name="project"
              control={control}
              placeholder={withLoading("Select project", projects.isLoading)}
              options={projects.data ?? []}
              onAddNew={() => openQuickAdd("project", "project")}
            />
          </div>

          <TextareaField
            label="Detailed Address (Optional)"
            name="detailed_address"
            register={register}
            maxLength={255}
            count={addressValue?.length ?? 0}
            placeholder="Enter detailed address"
          />
        </FormSection>

        <FormSection
          icon={Gauge}
          title="Maintenance Threshold"
          subtitle="Set maintenance threshold based on usage or other parameters."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Controller
              name="frequency_type_id"
              control={control}
              render={({ field }) => (
                <FrequencyTypeField
                  value={field.value}
                  onChange={(value, option) => {
                    field.onChange(value);
                    applyFrequencyType(option);
                  }}
                  onOptionResolved={applyFrequencyType}
                  error={errors.frequency_type_id?.message}
                />
              )}
            />
            <TextField
              label="Service Interval"
              name="service_interval"
              register={register}
              error={errors.service_interval?.message}
              required
              type="number"
              placeholder="Enter service interval"
              readOnly={selectedFrequency?.valueType.trim().toLowerCase() === "date" && selectedFrequency.daysPerUnit > 0}
              desc={selectedFrequency?.valueType.trim().toLowerCase() === "date" && selectedFrequency.daysPerUnit > 0
                ? `${selectedFrequency.intervalValue} ${selectedFrequency.unitName || "unit"} = ${selectedFrequency.daysPerUnit} days (from Frequency Type master data).`
                : undefined}
            />
            <TextField
              label="Warning Threshold"
              name="warning_threshold"
              register={register}
              error={errors.warning_threshold?.message}
              required
              type="number"
              placeholder="Enter warning threshold"
              desc="System will issue a warning when this threshold is reached."
            />
          </div>
          <Controller
            name="is_auto_create_work_order"
            control={control}
            render={({ field }) => (
              <div className="flex items-start gap-3 pt-3">
                <Switch
                  id="is_auto_create_work_order"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div>
                  <label htmlFor="is_auto_create_work_order" className="text-sm font-semibold">
                    Create Work Order Automatically
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Automatically create a maintenance task when the threshold is reached.
                  </p>
                </div>
              </div>
            )}
          />
        </FormSection>

        <FormSection
          icon={ImageIcon}
          title="Images"
          subtitle="Upload images of the equipment (optional)."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label
              htmlFor="equipment-images"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addImages(e.dataTransfer.files);
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary-200 bg-primary-50/40 p-8 text-center transition hover:border-primary-300"
            >
              <UploadCloud className="h-8 w-8 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">
                Drag and drop files here or{" "}
                <span className="text-primary-700">click to browse</span>
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG up to 5MB each
              </span>
              <input
                id="equipment-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => addImages(e.target.files)}
              />
            </label>

            <div className="flex min-h-40 flex-col rounded-lg border border-gray-200 p-4">
              {existingImages.length === 0 && images.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <ImageIcon className="h-7 w-7" />
                  <span className="text-sm font-medium">No image uploaded</span>
                  <span className="text-xs">
                    Upload images to better identify your equipment
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((image) => (
                    <ExistingImageThumb
                      key={image.id}
                      image={image}
                      equipmentId={equipmentId}
                    />
                  ))}
                  {images.map((image, index) => (
                    <div
                      key={image.url}
                      className="group relative aspect-square overflow-hidden rounded-md border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={`Equipment ${index + 1}`}
                        className={cn(
                          "h-full w-full object-cover",
                          image.uploadStatus === "getting-upload-url" ||
                            image.uploadStatus === "registering"
                            ? "opacity-50"
                            : ""
                        )}
                      />
                      {(image.uploadStatus === "getting-upload-url" ||
                        image.uploadStatus === "registering") && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                            {image.uploadStatus === "getting-upload-url" &&
                              "Getting URL..."}
                            {image.uploadStatus === "registering" &&
                              "Registering..."}
                          </span>
                        </div>
                      )}
                      {image.uploadStatus === "success" && (
                        <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white">
                          <CircleCheck className="h-3 w-3" />
                        </div>
                      )}
                      {image.uploadStatus === "error" && (
                        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center rounded bg-red-600 px-1 py-0.5">
                          <span className="text-[10px] font-medium text-white">
                            Failed
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            You can upload up to {MAX_IMAGES} images
          </p>
        </FormSection>

        <FormSection
          icon={CircleCheck}
          title="Status & Usage"
          subtitle="Set the current status and usage information."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Status"
              name="status"
              control={control}
              error={errors.status?.message}
              required
              placeholder="Select status"
              options={STATUS_OPTIONS}
            />
            <SelectField
              label="Condition"
              name="condition"
              control={control}
              placeholder="Select condition"
              options={CONDITION_OPTIONS}
            />
          </div>
        </FormSection>

        <div className="flex justify-between rounded-md bg-white px-5 py-4 shadow-md">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="min-w-40">
            <Save className="h-4 w-4" /> {submitLabel}
          </Button>
        </div>
      </form>

      <AddEquipmentCategoryDialog
        open={quickAdd?.type === "category"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={handleCreated}
      />
      <AddEquipmentTypeClassDialog
        open={quickAdd?.type === "type_class"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        categoryId={categoryValue || ""}
        onCreated={handleCreated}
      />
      <AddUnitOfMeasureDialog
        open={quickAdd?.type === "unit"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={handleCreated}
      />
      <AddCompanyDialog
        open={quickAdd?.type === "company"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={handleCreated}
      />
      <AddDepartmentDialog
        open={quickAdd?.type === "department"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={handleCreated}
      />
      <AddProjectDialog
        open={quickAdd?.type === "project"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function TextField({
  label,
  name,
  register,
  error,
  required,
  disabled,
  readOnly,
  placeholder,
  type = "text",
  desc,
  className
}: {
  label: string;
  name: keyof EquipmentFormValues;
  register: UseFormRegister<EquipmentFormValues>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  type?: "text" | "number";
  desc?: string;
  className?: string;
}) {
  return (
    <FormFieldLayout
      label={label}
      htmlFor={name}
      required={required}
      error={error}
      desc={desc}
      className={className}
    >
      <Input
        id={name}
        type={type}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={!!error}
        className={cn(
          "h-10 rounded-sm px-4 text-sm",
          readOnly && "cursor-not-allowed bg-gray-50 text-gray-500",
          error && "border-red-500 focus-visible:ring-red-500"
        )}
        {...register(name)}
      />
    </FormFieldLayout>
  );
}

function FrequencyTypeField({
  value,
  onChange,
  onOptionResolved,
  error,
}: {
  value?: string;
  onChange: (value: string, option: FrequencyTypeRefOption | null) => void;
  onOptionResolved: (option: FrequencyTypeRefOption | null) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const options = useFrequencyTypeOptions(debouncedSearch || undefined, open);
  const selected = useFrequencyTypeOption(value);
  const merged = new Map(
    [...(selected.data ? [selected.data] : []), ...options.items].map((option) => [option.value, option]),
  );

  useEffect(() => {
    if (selected.data) onOptionResolved(selected.data);
  }, [onOptionResolved, selected.data]);

  return (
    <LazySelect
      label="Trigger Parameter"
      name="frequency_type_id"
      value={value}
      onChange={(nextValue) => onChange(nextValue, merged.get(nextValue) ?? null)}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
      options={[...merged.values()]}
      totalLoaded={merged.size}
      isLoading={options.isLoading || selected.isLoading}
      isFetchingNextPage={options.isFetchingNextPage}
      hasMore={options.hasMore}
      onLoadMore={() => void options.loadMore()}
      onSearchChange={setSearch}
      search={search}
      searchPlaceholder="Search frequency type..."
      placeholder="Select trigger parameter"
      emptyMessage="No frequency type found."
      error={error}
      clearable
    />
  );
}

function TextareaField({
  label,
  name,
  register,
  maxLength,
  count,
  placeholder,
  className
}: {
  label: string;
  name: keyof EquipmentFormValues;
  register: UseFormRegister<EquipmentFormValues>;
  maxLength: number;
  count: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormFieldLayout label={label} htmlFor={name} className={className}>
      <div className="relative">
        <Textarea
          id={name}
          rows={4}
          maxLength={maxLength}
          placeholder={placeholder}
          className="rounded-sm px-4 py-2 text-sm"
          {...register(name)}
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
          {count}/{maxLength}
        </span>
      </div>
    </FormFieldLayout>
  );
}

function SelectField({
  label,
  name,
  control,
  error,
  required,
  placeholder,
  options,
  onAddNew
}: {
  label: string;
  name: keyof EquipmentFormValues;
  control: EquipmentControl;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: Option[];
  onAddNew?: () => void;
}) {
  return (
    <FormFieldLayout
      label={label}
      htmlFor={name}
      required={required}
      error={error}
    >
      <div className="flex gap-2">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              value={typeof field.value === "string" ? field.value : ""}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={name}
                aria-required={required}
                aria-invalid={!!error}
                className={cn(
                  "h-10 w-full rounded-sm",
                  error && "border-red-500 focus:ring-red-100"
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {onAddNew && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddNew}
            className="h-10 w-10 shrink-0 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
            aria-label={`Add new ${label.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </FormFieldLayout>
  );
}

function ExistingImageThumb({
  image,
  equipmentId
}: {
  image: EquipmentImage;
  equipmentId: string;
}) {
  const deleteImage = useDeleteEquipmentImage(equipmentId);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    deleteImage.mutate(image.id, {
      onSettled: () => setDeleting(false)
    });
  };

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-gray-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url ?? ""}
        alt="Equipment image"
        className={cn(
          "h-full w-full object-cover",
          deleting ? "opacity-50" : ""
        )}
      />
      {deleting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
            Deleting...
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
        aria-label="Delete image"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function CountryField({
  label,
  name,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  name: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { items, isLoading, isFetchingNextPage, hasMore, loadMore } =
    useCountries(
      { enabled: open },
      debouncedSearch || undefined,
    );
  const selectedQuery = useCountries(
    { enabled: Boolean(value) },
    value || undefined,
  );
  const options = mergeLocationItems(items, selectedQuery.items, value);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };
  return (
    <LazySelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      onOpenChange={handleOpenChange}
      onSearchChange={setSearch}
      search={search}
      // Prefer `id`, fall back to `code` if backend doesn't return id.
      options={options.map((item) => ({
        label: item.name,
        value: item.id ?? item.code,
      }))}
      totalLoaded={options.length}
      isLoading={isLoading || (Boolean(value) && selectedQuery.isLoading)}
      isFetchingNextPage={isFetchingNextPage}
      hasMore={hasMore}
      onLoadMore={loadMore}
      required={required}
      error={error}
      clearable
      placeholder="Select country"
    />
  );
}

function StateField({
  label,
  name,
  countryId,
  value,
  onChange,
}: {
  label: string;
  name: string;
  countryId?: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { items, isLoading, isFetchingNextPage, hasMore, loadMore } =
    useStates(
      countryId,
      { enabled: open },
      debouncedSearch || undefined,
    );
  const selectedQuery = useStates(
    countryId,
    { enabled: Boolean(value) },
    value || undefined,
  );
  const options = mergeLocationItems(items, selectedQuery.items, value);
  const disabled = !countryId;
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };
  return (
    <LazySelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      onOpenChange={handleOpenChange}
      onSearchChange={setSearch}
      search={search}
      // Prefer `id`, fall back to `code`.
      options={options.map((item) => ({ label: item.name, value: item.id ?? item.code }))}
      totalLoaded={options.length}
      isLoading={disabled ? false : isLoading || (Boolean(value) && selectedQuery.isLoading)}
      isFetchingNextPage={isFetchingNextPage}
      hasMore={hasMore}
      onLoadMore={loadMore}
      disabled={disabled}
      placeholder={disabled ? "Select a country first" : "Select state / province"}
      clearable
    />
  );
}

function CityField({
  label,
  name,
  stateId,
  value,
  onChange,
}: {
  label: string;
  name: string;
  stateId?: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { items, isLoading, isFetchingNextPage, hasMore, loadMore } =
    useCities(
      stateId,
      { enabled: open },
      debouncedSearch || undefined,
    );
  const selectedQuery = useCities(
    stateId,
    { enabled: Boolean(value) },
    value || undefined,
  );
  const options = mergeLocationItems(items, selectedQuery.items, value);
  const disabled = !stateId;
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };
  return (
    <LazySelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      onOpenChange={handleOpenChange}
      onSearchChange={setSearch}
      search={search}
      // Prefer `id`, fall back to `code`.
      options={options.map((item) => ({ label: item.name, value: item.id ?? item.code }))}
      totalLoaded={options.length}
      isLoading={disabled ? false : isLoading || (Boolean(value) && selectedQuery.isLoading)}
      isFetchingNextPage={isFetchingNextPage}
      hasMore={hasMore}
      onLoadMore={loadMore}
      disabled={disabled}
      placeholder={disabled ? "Select a state first" : "Select city / region"}
      clearable
    />
  );
}
