export type CampaignFormData = {
  name: string;
  platform: string;
  budget: number;
  startDate: string;
  endDate: string;
  objective: string;
  targeting: string[];
};

export type CampaignUiState = {
  isEditing: boolean;
  selectedCampaignId: string | null;
};
