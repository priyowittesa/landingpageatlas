import { z } from "zod";

export const ProjectStatus = {
  PROJECT_STATUS_UNSPECIFIED: "unspecified",
  PROJECT_STATUS_ACTIVE: "active",
  PROJECT_STATUS_INACTIVE: "inactive",
  PROJECT_STATUS_COMPLETED: "completed",
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

function toComparableDate(value: string) {
  const [month, day, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

export const projectSchema = z
  .object({
    address: z.string().max(255, "Address can contain at most 255 characters."),
    client_name: z.string().min(1, "Client / owner is required."),
    code: z.string().min(1, "Project code is required."),
    description: z
      .string()
      .max(1000, "Description can contain at most 1000 characters."),
    end_date: z.string().min(1, "Planned end date is required."),
    location: z.string().min(1, "Location is required."),
    priority: z.string(),
    project_manager_id: z.string().min(1, "Project manager is required."),
    start_date: z.string().min(1, "Planned start date is required."),
    status: z.string().min(1, "Project status is required."),
    tags: z.array(z.string()),
    title: z.string().min(1, "Project name is required."),
    type: z.string().min(1, "Project type is required."),
    project_team: z.array(
      z.object({
        member_id: z.string().optional(),
        labour_id: z.string().min(1),
        group_id: z.string().optional(),
        role_id: z.string().min(1, "Role in project is required."),
        department_id: z.string().min(1, "Department is required."),
        responsibility: z
          .string()
          .max(1000, "Responsibility can contain at most 1000 characters."),
        name: z.string(),
      }),
    ),
  })
  .refine(
    (project) =>
      !project.start_date ||
      !project.end_date ||
      toComparableDate(project.end_date) >=
        toComparableDate(project.start_date),
    {
      message: "End date cannot be earlier than start date.",
      path: ["end_date"],
    },
  );

export type ProjectPayload = z.infer<typeof projectSchema>;

export interface Project extends ProjectPayload {
  id: string;
  group_id?: string;
  project_manager_name?: string;
  status: ProjectStatus;
  progress?: number;
}

// address: string;
//   client_name: string;
//   code: string;
//   created_at: string;
//   description: string;
//   duration_months: number;
//   end_date: string;
//   id: string;
//   location: string;
//   priority: string;
//   project_manager_id: string;
//   project_type_id: string;
//   start_date: string;
//   status: string;
//   tags: string | null;
//   title: string;
//   updated_at: string;
// };

export const EMPTY_PROJECT: ProjectPayload = {
  address: "",
  client_name: "",
  code: "",
  description: "",
  end_date: "",
  location: "",
  priority: "",
  project_manager_id: "",
  start_date: "",
  status: ProjectStatus.PROJECT_STATUS_ACTIVE,
  tags: [],
  title: "",
  type: "",
  project_team: [],
};
