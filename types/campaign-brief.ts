export type AdsType = "search" | "display" | "video" | "shopping" | "app";

export type CampaignObjectiveKey =
  | "awareness"
  | "consideration"
  | "conversion"
  | "retention";

export type CampaignBriefStatus =
  | "in_review"
  | "approved"
  | "rejected"
  | "draft"
  | "pending";

export interface CampaignBrief {
  id: string;
  title: string;
  type_ads: AdsType;
  objective_type: CampaignObjectiveKey;
  status: CampaignBriefStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignBriefFilter {
  offset?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

export interface CampaignBriefFormDto {
  title: string;
  type_ads: AdsType;
  objective_type: CampaignObjectiveKey;
}
