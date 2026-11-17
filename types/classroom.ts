export type ClassroomStatus = "active" | "inactive" | "archived";

export type ClassroomDto = {
  id: string;
  name: string;
  status: ClassroomStatus;
  teacher_id: string;
  student_count: number;
  created_at: string;
};

export type ClassroomFormDto = {
  name: string;
  status?: ClassroomStatus;
  teacher_id: string;
};
