"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { type ApiResponseError } from "@/types/api";
import {
  DailyDiariesApiStatus,
  DailyDiariesDto,
  DailyDiariesFilter,
  DailyDiariesItem,
  DailyDiaryActivitiesFilter,
  DailyDiaryActivitiesItem,
  DailyDiaryCreatePayload,
  DailyDiaryUpdatePayload,
  DiaryAttachmentDto,
  DiaryCopySection,
  DiaryDuplicatePayload,
  DiaryAttachmentFilter,
  DiaryAttachmentItem,
  DiaryAttachmentPayload,
  DiaryAttachmentUploadUrlPayload,
  DiaryAttachmentUploadUrlResponse,
  DiaryExecutionDto,
  DiaryExecutionFilter,
  DiaryExecutionItem,
  DiaryExecutionPayload,
  DiaryExecutionUpdatePayload,
  DiaryIssueDto,
  DiaryIssueFilter,
  DiaryIssueItem,
  DiaryIssuePayload,
  DiaryLabourEquipmentFilter,
  DiaryLabourEquipmentItem,
  ProjectActivitiesFilter,
  ProjectActivityItem,
  ProjectActivityCreatePayload,
  ProjectWeather,
  ProjectWeatherPayload,
} from "@/types/type-daily-diaries";

const DAILY_DIARIES_URL = `${env.apiBaseUrl}/v1/construction-diary/diaries`;
const DAILY_DIARIES_ACTIVITIES_URL = `${env.apiBaseUrl}/v1/construction-diary/diary-activities`;
const DIARY_LABOUR_EQUIPMENT_URL = `${env.apiBaseUrl}/v1/construction-diary/diary-labour-equipment`;
const DIARY_EXECUTION_URL = `${env.apiBaseUrl}/v1/construction-diary/diary-execution`;
const DIARY_ISSUES_URL = `${env.apiBaseUrl}/v1/construction-diary/diary-issues`;
const DIARY_ATTACHMENTS_URL = `${env.apiBaseUrl}/v1/construction-diary/diary-attachments`;
const PROJECT_ACTIVITIES_URL = `${env.apiBaseUrl}/v1/construction-diary/project-activities`;
const PROJECT_WEATHER_URL = `${env.apiBaseUrl}/v1/construction-diary/projects`;
const axios = axiosConfig(env.apiBaseUrl);

const useGetDailyDiaries = (filter: DailyDiariesFilter) =>
  useQuery<DailyDiariesDto<DailyDiariesItem>, AxiosError<ApiResponseError>>({
    queryKey: ["getDailyDiaries", filter] as const,
    queryFn: async () => {
      const response = await axios.get<DailyDiariesDto<DailyDiariesItem>>(
        DAILY_DIARIES_URL,
        {
          params: filter,
        },
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch project daily diaries" },
  });

const useGetDailyDiary = (id?: string | null) =>
  useQuery<DailyDiariesItem, AxiosError<ApiResponseError>>({
    queryKey: ["getDailyDiary", id] as const,
    queryFn: async () => {
      const response = await axios.get<DailyDiariesItem>(
        `${DAILY_DIARIES_URL}/${id}`,
      );
      return response.data;
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to fetch daily diary" },
  });

const useGetDiaryExecution = (filter: DiaryExecutionFilter) =>
  useQuery<DiaryExecutionDto, AxiosError<ApiResponseError>>({
    queryKey: ["getDiaryExecution", filter] as const,
    queryFn: async () => {
      const response = await axios.get<DiaryExecutionDto>(DIARY_EXECUTION_URL, {
        params: filter,
      });
      return response.data;
    },
    enabled: Boolean(filter.diary_id),
    meta: { errorMessage: "Failed to fetch diary execution" },
  });

const useGetDiaryIssues = (filter: DiaryIssueFilter) =>
  useQuery<DiaryIssueDto, AxiosError<ApiResponseError>>({
    queryKey: ["getDiaryIssues", filter] as const,
    queryFn: async () => {
      const response = await axios.get<DiaryIssueDto>(DIARY_ISSUES_URL, {
        params: filter,
      });
      return response.data;
    },
    enabled: Boolean(filter.diary_id),
    meta: { errorMessage: "Failed to fetch diary issues" },
  });

const useGetDiaryAttachments = (filter: DiaryAttachmentFilter) =>
  useQuery<DiaryAttachmentDto, AxiosError<ApiResponseError>>({
    queryKey: ["getDiaryAttachments", filter] as const,
    queryFn: async () => {
      const response = await axios.get<DiaryAttachmentDto>(
        DIARY_ATTACHMENTS_URL,
        { params: filter },
      );
      return response.data;
    },
    enabled: Boolean(filter.diary_id),
    meta: { errorMessage: "Failed to fetch diary attachments" },
  });

const useGetDailyDiaryActivities = (filter?: DailyDiaryActivitiesFilter) =>
  useQuery<
    DailyDiariesDto<DailyDiaryActivitiesItem>,
    AxiosError<ApiResponseError>
  >({
    queryKey: ["getDailyDiariesActivities", filter] as const,
    queryFn: async () => {
      const response = await axios.get<
        DailyDiariesDto<DailyDiaryActivitiesItem>
      >(DAILY_DIARIES_ACTIVITIES_URL, {
        params: filter,
      });
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch project daily diaries activities" },
  });

const useGetProjectActivities = (filter: ProjectActivitiesFilter) =>
  useQuery<DailyDiariesDto<ProjectActivityItem>, AxiosError<ApiResponseError>>({
    queryKey: ["getProjectActivities", filter] as const,
    queryFn: async () => {
      const response = await axios.get<DailyDiariesDto<ProjectActivityItem>>(
        PROJECT_ACTIVITIES_URL,
        {
          params: filter,
        },
      );
      return response.data;
    },
    enabled: Boolean(filter.project_id),
    meta: { errorMessage: "Failed to fetch project activities" },
  });

const useCreateProjectActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProjectActivityItem,
    AxiosError<ApiResponseError>,
    ProjectActivityCreatePayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ProjectActivityItem>(
        PROJECT_ACTIVITIES_URL,
        payload,
      );
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["getProjectActivities"] }),
    meta: { errorMessage: "Failed to create project activity" },
  });
};

const useApplyProjectWeather = () =>
  useMutation<ProjectWeather, AxiosError<ApiResponseError>, ProjectWeatherPayload>({
    mutationFn: async ({ projectId, latitude, longitude }) => {
      const response = await axios.get<ProjectWeather>(
        `${PROJECT_WEATHER_URL}/${projectId}/weather`,
        { params: { latitude, longitude } },
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch today's weather" },
  });

const useGetDiaryLabourEquipments = (filter: DiaryLabourEquipmentFilter) =>
  useQuery<
    DailyDiariesDto<DiaryLabourEquipmentItem>,
    AxiosError<ApiResponseError>
  >({
    queryKey: ["getDiaryLabourEquipments", filter] as const,
    queryFn: async () => {
      const response = await axios.get<
        DailyDiariesDto<DiaryLabourEquipmentItem>
      >(DIARY_LABOUR_EQUIPMENT_URL, {
        params: filter,
      });
      return response.data;
    },
    enabled: Boolean(filter.diary_labour_id),
    meta: { errorMessage: "Failed to fetch diary labour equipment" },
  });

const useCreateDailyDiary = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DailyDiariesItem,
    AxiosError<ApiResponseError>,
    DailyDiaryCreatePayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<DailyDiariesItem>(
        DAILY_DIARIES_URL,
        payload,
      );
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["getDailyDiaries"] }),
    meta: { errorMessage: "Failed to create daily diary" },
  });
};

const useCreateDiaryExecution = () =>
  useMutation<
    DiaryExecutionItem,
    AxiosError<ApiResponseError>,
    DiaryExecutionPayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<DiaryExecutionItem>(
        DIARY_EXECUTION_URL,
        payload,
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to save execution details" },
  });

const useCreateDiaryIssues = () =>
  useMutation<
    DiaryIssueItem[],
    AxiosError<ApiResponseError>,
    DiaryIssuePayload[]
  >({
    mutationFn: async (payloads) => {
      const created: DiaryIssueItem[] = [];
      for (const payload of payloads) {
        const response = await axios.post<DiaryIssueItem>(
          DIARY_ISSUES_URL,
          payload,
        );
        created.push(response.data);
      }
      return created;
    },
    meta: { errorMessage: "Failed to save issues" },
  });

const useUpdateDailyDiary = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DailyDiariesItem,
    AxiosError<ApiResponseError>,
    { id: string; payload: DailyDiaryUpdatePayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.put<DailyDiariesItem>(
        `${DAILY_DIARIES_URL}/${id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["getDailyDiaries"] }),
    meta: { errorMessage: "Failed to update daily diary" },
  });
};

const useUpdateDiaryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DailyDiariesItem,
    AxiosError<ApiResponseError>,
    { id: string; status: DailyDiariesApiStatus }
  >({
    mutationFn: async ({ id, status }) => {
      const response = await axios.put<DailyDiariesItem>(
        `${DAILY_DIARIES_URL}/${id}/status`,
        { status },
      );
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["getDailyDiaries"] }),
    meta: { errorMessage: "Failed to update diary status" },
  });
};

// `id` is the execution record's own id (items[].id), not the diary id.
const useUpdateDiaryExecution = () =>
  useMutation<
    DiaryExecutionItem,
    AxiosError<ApiResponseError>,
    { id: string; payload: DiaryExecutionUpdatePayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.put<DiaryExecutionItem>(
        `${DIARY_EXECUTION_URL}/${id}`,
        payload,
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to update execution details" },
  });

// `id` is the issue's own id (items[].id), so each issue is updated in place.
const useUpdateDiaryIssue = () =>
  useMutation<
    DiaryIssueItem,
    AxiosError<ApiResponseError>,
    { id: string; payload: DiaryIssuePayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.put<DiaryIssueItem>(
        `${DIARY_ISSUES_URL}/${id}`,
        payload,
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to update issue" },
  });

async function getDiaryAttachmentUploadUrl(
  payload: DiaryAttachmentUploadUrlPayload,
): Promise<DiaryAttachmentUploadUrlResponse> {
  const response = await axios.post<DiaryAttachmentUploadUrlResponse>(
    `${DIARY_ATTACHMENTS_URL}/upload-url`,
    payload,
  );
  const data = response.data;

  if (!data?.upload_url || !data?.storage_key) {
    throw new Error("Invalid upload URL response");
  }
  return data;
}

async function uploadFileToStorage(uploadUrl: string, file: File) {
  const formData = new FormData();
  formData.append("uploadUrl", uploadUrl);
  formData.append("contentType", file.type || "application/octet-stream");
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const { error } = (await response.json()) as { error?: string };
    throw new Error(error ?? `Upload proxy failed: ${response.status}`);
  }
}

async function registerDiaryAttachment(payload: DiaryAttachmentPayload) {
  await axios.post(DIARY_ATTACHMENTS_URL, payload);
}

const useDownloadDiaryPdf = () =>
  useMutation<void, AxiosError<ApiResponseError>, { id: string; fileName?: string }>({
    mutationFn: async ({ id, fileName }) => {
      const response = await axios.get(`${DAILY_DIARIES_URL}/${id}/pdf`, {
        responseType: "blob",
      });

      const contentType =
        (response.headers["content-type"] as string | undefined) ||
        "application/pdf";

      const blob = new Blob([response.data as BlobPart], {
        type: contentType,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName ?? `${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    meta: { errorMessage: "Failed to export diary PDF" },
  });

const useDuplicateDiary = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DailyDiariesItem,
    AxiosError<ApiResponseError>,
    DiaryDuplicatePayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<DailyDiariesItem>(
        `${DAILY_DIARIES_URL}/duplicate`,
        payload,
      );
      return response.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["getDailyDiaries"] }),
    meta: { errorMessage: "Failed to duplicate diary data" },
  });
};

/** Maps UI section ids to the backend section values. */
const SECTION_TO_API: Record<string, DiaryCopySection> = {
  site: "diary",
  execution: "execution",
  issues: "issues",
  attachments: "attachments",
};

function mapSectionsToApi(sections: string[]): DiaryCopySection[] {
  return sections
    .map((s) => SECTION_TO_API[s])
    .filter((s): s is DiaryCopySection => Boolean(s));
}

async function uploadDiaryAttachment({
  category,
  diaryId,
  file,
}: {
  category: DiaryAttachmentPayload["category"];
  diaryId: string;
  file: File;
}) {
  const { upload_url, storage_key } = await getDiaryAttachmentUploadUrl({
    category,
    diary_id: diaryId,
    file_name: file.name,
  });

  await uploadFileToStorage(upload_url, file);

  await registerDiaryAttachment({
    category,
    diary_id: diaryId,
    file_name: file.name,
    storage_key,
  });
}

export {
  useGetDailyDiaries,
  useGetDailyDiary,
  useGetDailyDiaryActivities,
  useGetProjectActivities,
  useCreateProjectActivity,
  useApplyProjectWeather,
  useGetDiaryLabourEquipments,
  useGetDiaryExecution,
  useGetDiaryIssues,
  useGetDiaryAttachments,
  useCreateDailyDiary,
  useCreateDiaryExecution,
  useCreateDiaryIssues,
  useUpdateDailyDiary,
  useUpdateDiaryExecution,
  useUpdateDiaryIssue,
  useUpdateDiaryStatus,
  getDiaryAttachmentUploadUrl,
  uploadFileToStorage,
  registerDiaryAttachment,
  uploadDiaryAttachment,
  useDownloadDiaryPdf,
  useDuplicateDiary,
  mapSectionsToApi,
};
