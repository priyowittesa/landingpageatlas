import { NotebookPen } from "lucide-react";
import { useFormContext } from "react-hook-form";

import FormFieldLayout from "@/components/FormFieldLayout";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeForm } from "@/types/type-employee";
import { EmployeeSection } from "./employee-section";

export default function EmployeeNotesForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EmployeeForm>();

  return (
    <EmployeeSection
      title="Note"
      subtitle="Add any additional note or comments."
      icon={NotebookPen}
    >
      <FormFieldLayout
        label="Note"
        htmlFor="note"
        error={errors.note?.message}
      >
        <Textarea
          id="note"
          rows={4}
          maxLength={255}
          placeholder="Write additional compliance or employee records here..."
          className="resize-none rounded-sm"
          {...register("note")}
        />
      </FormFieldLayout>
    </EmployeeSection>
  );
}
