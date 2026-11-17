"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  EquipmentForm,
  type ImageEntry,
  type ImageUploadStatus
} from "../components/equipment-form";
import {
  toEquipmentApiPayload,
  type EquipmentFormValues
} from "../form-schema";
import {
  getEquipmentImageUploadUrl,
  registerEquipmentImage,
  uploadImageToS3,
  useCreateEquipment
} from "../use-equipment";

export default function AddEquipmentPage() {
  const router = useRouter();
  const createEquipment = useCreateEquipment();
  const [uploading, setUploading] = useState(false);

  const uploadSingleImage = async (
    equipmentId: string,
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
      const { upload_url, storage_key } = await getEquipmentImageUploadUrl(equipmentId, {
        file_name: file.name
      });

      setStatus(index, {
        uploadStatus: "uploading-s3",
        storageKey: storage_key
      });
      await uploadImageToS3(upload_url, file);

      setStatus(index, { uploadStatus: "registering" });
      await registerEquipmentImage(equipmentId, {
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
    createEquipment.mutate(toEquipmentApiPayload(values), {
      onSuccess: async (created) => {
        const equipmentId = created?.id;
        if (equipmentId && images.length > 0) {
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
    });
  };

  return (
    <EquipmentForm
      title="Add Equipment"
      description="Create a new equipment or asset and add its details."
      pending={createEquipment.isPending || uploading}
      submitLabel={
        createEquipment.isPending
          ? "Saving..."
          : uploading
            ? "Uploading images..."
            : "Save Equipment"
      }
      onCancel={() => router.push("/app/master-data/equipment")}
      onSubmit={handleSubmit}
    />
  );
}
