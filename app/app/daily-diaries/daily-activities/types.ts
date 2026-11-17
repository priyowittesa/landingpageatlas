export type DiaryStatus =
  | "Draft Saved"
  | "Not Started"
  | "Submitted"
  | "Approved"
  | "Rejected";

export type Project = {
  id: string;
  name: string;
  status: Exclude<DiaryStatus, "Rejected">;
  progress: number;
};

export type DiaryRecord = {
  date: string;
  status: DiaryStatus;
  preparedBy?: string;
  submittedAt?: string;
};

export type ApprovalItem = {
  date: string;
  projectId: string;
  submittedBy: string;
};
