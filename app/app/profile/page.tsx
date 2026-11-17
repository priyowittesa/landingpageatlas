"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Info,
  LoaderCircle,
  RotateCcw,
  Save
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FormTextField from "@/components/FormTextField";
import { useAuthMe, type AuthMeData } from "@/hooks/useAuthMe";
import {
  useUpdateProfile,
  type UpdateLabourPayload
} from "@/app/app/profile/hooks/useProfile";
import { ChangePasswordDialog } from "@/app/app/profile/components/ChangePasswordDialog";

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().min(1, "Company size is required"),
  businessPriorities: z.string().min(1, "Business priorities are required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(1, "Job title is required")
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EMPTY_VALUES: ProfileFormValues = {
  companyName: "",
  industry: "",
  companySize: "",
  businessPriorities: "",
  fullName: "",
  email: "",
  phone: "",
  department: "",
  jobTitle: ""
};

/** Maps the /v1/auth/me response into the profile form values. */
function meToFormValues(me: AuthMeData): ProfileFormValues {
  const labour = me.labour;
  const company = me.company;
  return {
    companyName: company?.company_name ?? "",
    industry: company?.industry ?? "",
    companySize: company?.company_size ?? "",
    businessPriorities: company?.business_priorities ?? "",
    fullName: labour?.full_name ?? me.name ?? "",
    email: me.email ?? labour?.email ?? "",
    phone: labour?.phone_number ?? "",
    department: labour?.department_name ?? "",
    jobTitle: labour?.position_name || labour?.role_name || ""
  };
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Last changed 3 months ago" style label from an ISO timestamp. */
function formatLastChanged(iso?: string): string {
  if (!iso) return "Never changed";
  try {
    return `Last changed ${formatDistanceToNow(new Date(iso), {
      addSuffix: true
    })}`;
  } catch {
    return "Last changed recently";
  }
}

/** "Sept 6, 2026 at 2:30 PM" style label from an ISO timestamp. */
function formatLastLogin(iso?: string): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "—";
  }
}

function DetailsCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 px-6 py-5">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">{children}</CardContent>
    </Card>
  );
}

/** Read-only field used in the Account & Security card. */
function SecurityField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 min-w-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="text-sm font-semibold text-gray-900">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: me, isLoading } = useAuthMe();
  const updateProfile = useUpdateProfile();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_VALUES
  });

  // Populate the form once the /v1/auth/me data is available.
  useEffect(() => {
    if (me) reset(meToFormValues(me));
  }, [me, reset]);

  const onSubmit = (values: ProfileFormValues) => {
    const labourId = me?.labour?.id;
    if (!labourId) {
      toast.error("Unable to update profile", {
        description: "No labour record is linked to your account."
      });
      return;
    }

    const labour = me?.labour;
    const payload: UpdateLabourPayload = {
      full_name: values.fullName,
      email: values.email,
      phone_number: values.phone,
      department_id: labour?.department_id || "",
      position_id: labour?.position_id || "",
      role_id: labour?.role_id || "",
      preferred_name: labour?.preferred_name || "",
      status: labour?.status || "active",
      type: labour?.type || "contract"
    };

    updateProfile.mutate(
      { id: labourId, payload },
      {
        onSuccess: () => {
          // Company fields are not part of the labour payload; surface a
          // note so the user knows only personal info was persisted.
          const companyTouched =
            values.companyName !== (me?.company?.company_name ?? "") ||
            values.industry !== (me?.company?.industry ?? "") ||
            values.companySize !== (me?.company?.company_size ?? "") ||
            values.businessPriorities !==
              (me?.company?.business_priorities ?? "");
          if (companyTouched) {
            toast.info("Personal information saved", {
              description:
                "Company details are managed by your tenant administrator."
            });
          }
        }
      }
    );
  };

  const onCancel = () => {
    reset(me ? meToFormValues(me) : EMPTY_VALUES);
    toast.info("Changes discarded");
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success("Photo selected", { description: file.name });
    }
  };

  const company = me?.company;
  const labour = me?.labour;
  const displayName = company?.company_name || me?.name || "My Company";
  const subtitle = [company?.industry, company?.company_size]
    .filter(Boolean)
    .join(" • ");
  const labourStatus = labour?.status;
  const saving = isSubmitting || updateProfile.isPending;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <LoaderCircle className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        id="profile-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {/* Profile header */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="bg-primary-100 text-xl font-semibold text-primary-700">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                aria-label="Change photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {displayName}
                </h1>
                {labourStatus && (
                  <Badge
                    variant={labourStatus === "active" ? "green" : "secondary"}
                  >
                    {labourStatus.charAt(0).toUpperCase() +
                      labourStatus.slice(1)}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {updateProfile.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info alert */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800">
            Account & Security have separate edit flows and cannot be changed
            here.
          </p>
        </div>

        {/* Company details */}
        <DetailsCard
          title="Company Details"
          description="Organization profile and business information."
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <FormTextField
              label="Company Name"
              name="companyName"
              register={register}
              error={errors.companyName}
              placeholder="Company name"
            />
            <FormTextField
              label="Industry"
              name="industry"
              register={register}
              error={errors.industry}
              placeholder="Industry"
            />
            <FormTextField
              label="Company Size"
              name="companySize"
              register={register}
              error={errors.companySize}
              placeholder="Company size"
            />
            <FormTextField
              label="Business priorities"
              name="businessPriorities"
              register={register}
              error={errors.businessPriorities}
              placeholder="Business priorities"
            />
          </div>
        </DetailsCard>

        {/* Personal information */}
        <DetailsCard
          title="Personal Information"
          description="Modify your contact details and business context."
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <FormTextField
              label="Full Name"
              name="fullName"
              register={register}
              error={errors.fullName}
              placeholder="Full name"
            />
            <FormTextField
              label="Email Address"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              placeholder="name@company.com"
            />
            <FormTextField
              label="Phone Number"
              name="phone"
              register={register}
              error={errors.phone}
              placeholder="+1 (555) 000-0000"
            />
            <FormTextField
              label="Department"
              name="department"
              register={register}
              error={errors.department}
              placeholder="Department"
            />
            <FormTextField
              label="Job Title"
              name="jobTitle"
              register={register}
              error={errors.jobTitle}
              placeholder="Job title"
            />
          </div>
        </DetailsCard>
      </form>

      {/* Account & Security — separate edit flow, outside the profile form */}
      <Card className="shadow-sm">
        <CardHeader className="space-y-1 px-6 py-5">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Account & Security
          </CardTitle>
          <CardDescription>
            Manage authentication, credentials, and verification status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-6">
            <SecurityField label="Username">
              {me?.username || me?.email || "—"}
            </SecurityField>
            <SecurityField label="Email Verification">
              <span className="inline-flex items-center gap-1.5">
                {me?.email_verified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{me?.email || "Verified"}</span>
                  </>
                ) : (
                  <span className="text-gray-500">
                    {me?.email || "Not verified"}
                  </span>
                )}
              </span>
            </SecurityField>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-6">
            <SecurityField label="Password">
              {formatLastChanged(me?.password_changed_at)}
            </SecurityField>
            <SecurityField label="Last Login">
              {formatLastLogin(me?.last_login_at)}
            </SecurityField>
          </div>

          <div className="flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
}
