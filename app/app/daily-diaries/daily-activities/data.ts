import type { ApprovalItem, DiaryRecord, Project } from "./types";

export const projects: Project[] = [
  { id: "AP8282", name: "BHP Newman West Water", status: "Draft Saved", progress: 34 },
  { id: "AP4242", name: "BHP Newman West Water", status: "Not Started", progress: 12 },
  { id: "AP112", name: "BHP Newman West Water", status: "Approved", progress: 89 },
  { id: "AP8282", name: "BHP Newman West Water", status: "Submitted", progress: 89 },
  { id: "AP8282", name: "BHP Newman West Water", status: "Submitted", progress: 89 },
  { id: "AP4242", name: "BHP Newman West Water", status: "Not Started", progress: 12 },
  { id: "AP8282", name: "BHP Newman West Water", status: "Draft Saved", progress: 34 },
  { id: "AP4242", name: "BHP Newman West Water", status: "Not Started", progress: 12 },
  { id: "AP8282", name: "BHP Newman West Water", status: "Draft Saved", progress: 34 },
  { id: "AP112", name: "BHP Newman West Water", status: "Approved", progress: 89 },
  { id: "AP8282", name: "BHP Newman West Water", status: "Submitted", progress: 89 },
  { id: "AP8282", name: "BHP Newman West Water", status: "Draft Saved", progress: 34 },
];

export const diaryRecords: DiaryRecord[] = [
  { date: "2026-07-02", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-03", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-04", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-05", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-06", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-07", status: "Approved", preparedBy: "Khalid Al-Mansoori", submittedAt: "17:45" },
  { date: "2026-07-08", status: "Submitted", preparedBy: "Khalid Al-Mansoori", submittedAt: "17:45" },
  { date: "2026-07-09", status: "Not Started" },
  { date: "2026-07-12", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-13", status: "Submitted", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-14", status: "Draft Saved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-15", status: "Submitted", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-16", status: "Approved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-17", status: "Submitted", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-18", status: "Draft Saved", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-19", status: "Rejected", preparedBy: "Khalid Al-Mansoori" },
  { date: "2026-07-20", status: "Not Started" },
];

export const approvalItems: ApprovalItem[] = [
  {
    date: "2026-07-15",
    projectId: "AP8282",
    submittedBy: "Khalid Al-Mansoori",
  },
];

export function findProject(projectId: string) {
  return projects.find((project) => project.id.toLowerCase() === projectId.toLowerCase()) ?? projects[0];
}
