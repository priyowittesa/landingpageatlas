import FormSelectField from "@/components/FormSelectField";
import FormTextField from "@/components/FormTextField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FormEvent, ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  AddAssemblyPartFormValues,
  addAssemblyPartSchema,
  AddGroupFormValues,
  addGroupSchema,
  AddLinesFormValues,
  addLinesSchema,
  AddPartFormValues,
  addPartSchema,
  AddProductFormValues,
  addProductSchema,
} from "../schemas";
import { zodResolver } from "@hookform/resolvers/zod";

type ProductStructureModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
};

function ProductStructureModal({
  open,
  onOpenChange,
  title,
  onSubmit,
  children,
}: ProductStructureModalProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-135 gap-0 rounded-xl p-0">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          {children}

          <div className="flex justify-end gap-2 px-5 pb-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(open)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ModalProps = {
  open: boolean;
  onOpenChange: () => void;
  title?: string;
  onSubmit?: () => void;
};

export function AddProductModal({
  open,
  onOpenChange,
  title = "Add Product",
}: ModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      productCode: "",
      productName: "",
      status: undefined as unknown as AddProductFormValues["status"],
    },
  });

  function onSubmit() {
    console.log(watch);
  }

  return (
    <ProductStructureModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4 p-5">
        <FormTextField
          label="Product Code"
          name="productCode"
          register={register}
          error={errors.productCode}
          required
          placeholder="Type Product Code"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormTextField
            label="Product Name"
            name="productName"
            register={register}
            error={errors.productName}
            required
            placeholder="Type Product Name"
          />
          <FormSelectField
            label="Status"
            name="status"
            control={control}
            search={false}
            placeholder="Select status"
            error={errors.status}
            required
            options={[
              { label: "Active", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </div>
      </div>
    </ProductStructureModal>
  );
}

export function AddGroupModal({
  open,
  onOpenChange,
  title = "Add Group",
  // onSubmit,
}: ModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddGroupFormValues>({
    resolver: zodResolver(addGroupSchema),
    defaultValues: {
      groupCode: "",
      groupName: "",
      productionLines: undefined,
      status: undefined as unknown as AddGroupFormValues["status"],
    },
  });

  function onSubmit() {
    console.log(watch);
  }

  return (
    <ProductStructureModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-4 p-5">
        <FormTextField
          label="Group Code"
          name="groupCode"
          register={register}
          error={errors.groupCode}
          required
          placeholder="Type Group Code"
        />
        <FormTextField
          label="Group Name"
          name="groupName"
          register={register}
          error={errors.groupName}
          required
          placeholder="Type Group Name"
        />
        <FormTextField
          label="Production Lines"
          name="productionLines"
          register={register}
          error={errors.productionLines}
          required
          placeholder="Type Production Lines"
        />
        <FormSelectField
          label="Status"
          name="status"
          control={control}
          search={false}
          placeholder="Select status"
          error={errors.status}
          required
          options={[
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
      </div>
    </ProductStructureModal>
  );
}

export function AddLinesModal({
  open,
  onOpenChange,
  title = "Add Lines",
  // onSubmit,
}: ModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddLinesFormValues>({
    resolver: zodResolver(addLinesSchema),
    defaultValues: {
      lineCode: "",
      lineName: "",
      efficiency: undefined,
      status: undefined as unknown as AddLinesFormValues["status"],
    },
  });

  function onSubmit() {
    console.log(watch);
  }

  return (
    <ProductStructureModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-4 p-5">
        <FormTextField
          label="Line Code"
          name="lineCode"
          register={register}
          error={errors.lineCode}
          required
          placeholder="Type Line Code"
        />
        <FormTextField
          label="Line Name"
          name="lineName"
          register={register}
          error={errors.lineName}
          required
          placeholder="Type Line Name"
        />
        <FormTextField
          label="Efficiency"
          name="efficiency"
          register={register}
          error={errors.efficiency}
          required
          placeholder="Type Efficiency"
        />
        <FormSelectField
          label="Status"
          name="status"
          control={control}
          error={errors.status}
          search={false}
          placeholder="Select status"
          required
          options={[
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
          ]}
        />
      </div>
    </ProductStructureModal>
  );
}

export function AddPartModal({
  open,
  onOpenChange,
  title = "Add Part",
  // onSubmit,
}: ModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddPartFormValues>({
    resolver: zodResolver(addPartSchema),
    defaultValues: {
      partNumber: "",
      partName: "",
      backNumber: "",
      model: "",
      cycleTime: undefined,
      spm: undefined,
      status: undefined as unknown as AddPartFormValues["status"],
    },
  });

  function onSubmit() {
    console.log(watch);
  }

  return (
    <ProductStructureModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-4 p-5">
        <FormTextField
          label="Part Number"
          name="partNumber"
          register={register}
          error={errors.partNumber}
          required
          placeholder="Type Part Number"
        />
        <FormTextField
          label="Part Name"
          name="partName"
          register={register}
          error={errors.partName}
          required
          placeholder="Type Part Name"
        />
        <FormTextField
          label="Back Number"
          name="backNumber"
          register={register}
          error={errors.backNumber}
          required
          placeholder="Type Back Number"
        />
        <FormTextField
          label="Model"
          name="model"
          register={register}
          error={errors.model}
          required
          placeholder="Type Model"
        />
        <FormTextField
          label="Cycle Time"
          name="cycleTime"
          register={register}
          error={errors.cycleTime}
          required
          placeholder="Type Cycle Time"
        />
        <FormTextField
          label="Spm"
          name="spm"
          register={register}
          error={errors.spm}
          required
          placeholder="Type Spm"
        />
        <FormSelectField
          label="Status"
          name="status"
          control={control}
          search={false}
          placeholder="Select status"
          required
          options={[
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
          ]}
        />
      </div>
    </ProductStructureModal>
  );
}

export function AddAssemblyPartModal({
  open,
  onOpenChange,
  title = "Add Assembly Part",
  // onSubmit,
}: ModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddAssemblyPartFormValues>({
    resolver: zodResolver(addAssemblyPartSchema),
    defaultValues: {
      partNumber: "",
      partName: "",
      usage: undefined,
      status: undefined as unknown as AddAssemblyPartFormValues["status"],
    },
  });

  function onSubmit() {
    console.log(watch);
  }

  return (
    <ProductStructureModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-4 p-5">
        <FormTextField
          label="Part Number"
          name="partNumber"
          register={register}
          error={errors.partNumber}
          required
          placeholder="Type Part Number"
        />
        <FormTextField
          label="Part Name"
          name="partName"
          register={register}
          error={errors.partName}
          required
          placeholder="Type Part Name"
        />
        <FormTextField
          label="Usage"
          name="usage"
          register={register}
          error={errors.usage}
          required
          placeholder="Type Usage"
        />
        <FormSelectField
          label="Status"
          name="status"
          control={control}
          error={errors.status}
          search={false}
          placeholder="Select status"
          required
          options={[
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
          ]}
        />
      </div>
    </ProductStructureModal>
  );
}
