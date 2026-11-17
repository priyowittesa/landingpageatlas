export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";

export type CampaignDto = {
  id: string;
  name: string;
  status: CampaignStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  platform?: string;
  created_at: string;
  updated_at: string;
};

export type CampaignFormDto = {
  name: string;
  status?: CampaignStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  platform?: string;
};

export type CampaignFilter = {
  offset?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
};
