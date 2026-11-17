export type PreventiveMaintenance = {
  id: string;
  preventiveCode: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  model: string;
  project: string;
  frequencyType: string;
  thresholdValue: number;
  currentUsage: number;
  lastServiceUsage: number;
  usageSinceLastService: number;
  unit: string;
  workOrderStatus: string;
  latestUsage: number;
  latestUsageAt: string;
  latestUsageBy: string;
};

export type PreventiveListParams = {
  search?: string;
  assetId?: string;
  status?: string;
  frequencyType?: string;
  pageSize: number;
  pageToken?: string;
};

export type PreventiveListResult = {
  items: PreventiveMaintenance[];
  nextPageToken: string;
  totalCount: number;
};
