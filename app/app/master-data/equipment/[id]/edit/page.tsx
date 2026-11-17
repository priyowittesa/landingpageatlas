"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { EquipmentForm, type ImageEntry, type ImageUploadStatus } from "../../components/equipment-form";
import {
  fromEquipmentApi,
  toEquipmentApiPayload,
  type EquipmentFormValues
} from "../../form-schema";
import {
  getEquipmentImageUploadUrl,
  registerEquipmentImage,
  uploadImageToS3,
  useEquipmentDetail,
  useEquipmentImages,
  useUpdateEquipment
} from "../../use-equipment";

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const equipmentId = params.id;
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const { data: rawDetail, isLoading } = useEquipmentDetail(equipmentId);
  const { data: existingImages } = useEquipmentImages(equipmentId);
  const updateEquipment = useUpdateEquipment();
  const [uploading, setUploading] = useState(false);

  const initialValues = useMemo<EquipmentFormValues | undefined>(() => {
    if (!rawDetail) return undefined;
    return fromEquipmentApi(rawDetail);
  }, [rawDetail]);

  useEffect(() => {
    if (!initialValues) return;

    setBreadcrumbItems([
      { title: "Master Data", href: "/app/master-data" },
      { title: "Equipment", href: "/app/master-data/equipment" },
      { title: initialValues.name || initialValues.code || "Equipment" },
      { title: "Edit" }
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, initialValues, setBreadcrumbItems]);

  const uploadSingleImage = async (
    eqId: string,
    file: File,
    sortOrder: number,
    setStatus: (
      index: number,
      update: Partial<Omit<ImageEntry, "file" | "url">>
    ) => void,
    index: number
  ): Promise<boolean> => {
    try {
      setStatus(index, { uploadStatus: "getting-upload-url" });
      const { upload_url, storage_key } = await getEquipmentImageUploadUrl(eqId, {
        file_name: file.name
      });

      setStatus(index, {
        uploadStatus: "uploading-s3",
        storageKey: storage_key
      });
      await uploadImageToS3(upload_url, file);

      setStatus(index, { uploadStatus: "registering" });
      await registerEquipmentImage(eqId, {
        sort_order: sortOrder,
        storage_key
      });

      setStatus(index, { uploadStatus: "success", storageKey: storage_key });
      return true;
    } catch {
      setStatus(index, {
        uploadStatus: "error",
        uploadError: "Upload failed"
      });
      return false;
    }
  };

  const handleSubmit = async (
    values: EquipmentFormValues,
    images: File[],
    _uploadStatuses: ImageUploadStatus[],
    setUploadStatus: (
      index: number,
      update: Partial<Omit<ImageEntry, "file" | "url">>
    ) => void
  ) => {
    updateEquipment.mutate(
      { id: equipmentId, payload: toEquipmentApiPayload(values) },
      {
        onSuccess: async () => {
          if (images.length > 0) {
            setUploading(true);
            await Promise.all(
              images.map((file, i) =>
                uploadSingleImage(equipmentId, file, i, setUploadStatus, i)
              )
            );
            setUploading(false);
          }
          router.push("/app/master-data/equipment");
        }
      }
    );
  };

  if (isLoading || !initialValues) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading equipment details...
      </div>
    );
  }

  return (
    <EquipmentForm
      isEdit
      title="Edit Equipment"
      description="Update equipment or asset details."
      initialValues={initialValues}
      existingImages={existingImages ?? []}
      equipmentId={equipmentId}
      pending={updateEquipment.isPending || uploading}
      submitLabel={
        updateEquipment.isPending
          ? "Saving..."
          : uploading
            ? "Uploading images..."
            : "Save Changes"
      }
      onCancel={() => router.push("/app/master-data/equipment")}
      onSubmit={handleSubmit}
    />
  );
}
