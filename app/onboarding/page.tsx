"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Clock3,
  Headphones,
  Rocket,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  useCreateLabour,
  useCreateRole,
  useCreateTenant,
  fetchMe,
  type CreateTenantPayload
} from "@/app/onboarding/hooks/useOnboarding";

const fields = [
  {
    name: "industry",
    label: "Industry",
    placeholder: "Select your industry",
    options: [
      "Marketing & Advertising",
      "Manufacturing",
      "Construction",
      "Oil & Gas",
      "Mining",
      "Supply Chain & Logistics",
      "Property Management",
      "Hospitality",
      "Retail",
      "Professional Services",
      "Healthcare",
      "Education",
      "Technology",
      "Government",
      "Other"
    ]
  },
  {
    name: "companySize",
    label: "Company Size",
    placeholder: "Select your company size",
    options: [
      "1-10 employees",
      "11-50 employees",
      "51-200 employees",
      "201-500 employees",
      "500-1,000 employees",
      "1,000+ employees"
    ]
  },
  {
    name: "businessPriority",
    label: "What are your business priorities?",
    placeholder: "Select your business priorities",
    options: [
      "Increase Revenue",
      "Improve Marketing Performance",
      "Improve Customer Experience",
      "Optimise Operations",
      "Improve Asset Reliability",
      "Reduce Equipment Downtime",
      "Improve Procurement",
      "Manage Construction Projects",
      "Improve Workplace Safety",
      "Improve Data Quality",
      "Automate Manual Processes",
      "Gain Better Business Insights"
    ]
  },
  {
    name: "department",
    label: "Which departments will use ATLAS?",
    placeholder: "Select your user departments",
    options: [
      "Executive",
      "Marketing",
      "Sales",
      "Customer Service",
      "Operations",
      "Procurement",
      "Engineering",
      "Maintenance",
      "Project Management",
      "Finance",
      "Human Resources",
      "IT"
    ]
  },
  {
    name: "currentTool",
    label: "What tools do you currently use?",
    placeholder: "Select tools",
    options: [
      "Microsoft Excel",
      "Google Sheets",
      "SAP",
      "Oracle",
      "Microsoft Dynamics 365",
      "Salesforce",
      "HubSpot",
      "Monday.com",
      "Asana",
      "Jira",
      "None",
      "Other"
    ]
  },
  {
    name: "primaryGoal",
    label: "What's your primary goal with ATLAS?",
    placeholder: "Select your goal",
    options: [
      "Explore during the free trial",
      "Replace existing systems",
      "Scale business operations",
      "Solve a specific business challenge",
      "Still exploring"
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const createTenant = useCreateTenant();
  const createRole = useCreateRole();
  const createLabour = useCreateLabour();
  const isSubmitting =
    createTenant.isPending || createRole.isPending || createLabour.isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = session?.user.id;
    const accessToken = session?.accessToken;
    if (!userId || !accessToken) return;

    const formData = new FormData(event.currentTarget);
    const payload: CreateTenantPayload = {
      user_id: userId,
      company_name: String(formData.get("companyName") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      company_size: String(formData.get("companySize") ?? ""),
      business_priorities: String(formData.get("businessPriority") ?? ""),
      departments: String(formData.get("department") ?? ""),
      tools: String(formData.get("currentTool") ?? ""),
      primary_goal: String(formData.get("primaryGoal") ?? "")
    };

    try {
      await createTenant.mutateAsync(payload);
      const roleResult = await createRole.mutateAsync({
        name: "Superadmin",
        description: "Role tenant for superadmin"
      });
      const roleId = roleResult?.id;
      if (!roleId) throw new Error("Role id missing from response");

      const me = await fetchMe();
      const authUserId = me?.user_id;
      const fullName = me?.full_name ?? session?.user?.name ?? "";
      const email = me?.email ?? session?.user?.email ?? "";

      await createLabour.mutateAsync({
        email,
        full_name: fullName,
        auth_user_id: authUserId ?? "",
        type: "full_time",
        role_id: roleId,
        temporary_password: "Qwerty123*",
        code: "ADM-001"
      });

      router.replace("/app/workspace-dashboard?skipTransactions=1");
    } catch {
      // Surface handled by per-mutation errorMeta; nothing extra to do.
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[350px_1fr]">
      <aside className="relative overflow-hidden bg-[#35176b] px-8 py-9 text-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex items-center gap-3">
          <Image src="/atlas-logo.svg" alt="ATLAS" width={26} height={24} />
          <span className="text-lg font-semibold">ATLAS </span>
        </div>

        <div className="mt-10">
          <h1 className="text-[28px] font-bold">Let&apos;s Get Started</h1>
          <p className="mt-2 max-w-[280px] text-sm leading-7 text-primary-100">
            Help us understand your business so we can personalize your
            workspace and recommend the right solutions for you.
          </p>
        </div>

        <div className="my-10 hidden flex-1 items-center justify-center lg:flex">
          <Image src="/onboard.svg" alt="ATLAS" width={240} height={240} />
        </div>

        <div className="mt-10 flex flex-col gap-2 rounded-xl border border-primary-400/20 bg-primary-800 p-4 lg:mt-0">
          <ShieldCheck className="mt-0.5 h-10 w-10 shrink-0 text-primary-200" />
          <div className="flex gap-3">
            <div>
              <p className="text-xs font-semibold">
                Your information is safe with us
              </p>
              <p className="mt-1 text-xs leading-5 text-primary-100">
                We&apos;ll only use this information to provide a better ATLAS
                experience for you.
              </p>
            </div>
          </div>
          <div className=" flex items-center gap-2 pt-4 text-xs text-primary-100">
            <Headphones className="h-4 w-4" />
            <span>Need help? Contact our support team</span>
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[700px] rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <header className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                Tell us about your organisation
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Let&apos;s start with some basic information about your company.
              </p>
            </div>
          </header>

          <form className="mt-10" onSubmit={handleSubmit}>
            <label
              className="block text-sm font-bold text-gray-900"
              htmlFor="company-name"
            >
              Company Name
            </label>
            <input
              id="company-name"
              name="companyName"
              required
              className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="Enter your company name"
            />

            <div className="mt-6 grid gap-x-5 gap-y-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label
                  key={field.label}
                  className="block text-sm font-bold text-gray-900"
                >
                  {field.label}
                  <Select name={field.name} required>
                    <SelectTrigger className="mt-2 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ))}
            </div>

            <div className="mt-10 flex gap-4 rounded-xl border border-primary-200 bg-primary-50/70 p-5 text-primary-700 flex flex-col sm:flex-row sm:items-center">
              <Sparkles className="mt-0.5 h-8 w-8 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Why we ask this?</p>
                <p className="mt-1 text-xs leading-5 text-primary-600">
                  This information helps our AI understand your business context
                  so we can recommend the most relevant packages, modules, and
                  insights for your needs.
                </p>
              </div>
            </div>

            <footer className="mt-10 flex flex-col-reverse items-stretch justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock3 className="h-4 w-4" />
                <span>Estimated time: 1 minute</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !session?.user.id}
                className="h-10 rounded-lg bg-[#5f2bb8] px-10 text-sm font-semibold text-white transition hover:bg-[#4e209d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Setting up your workspace..."
                  : "Go to Workspace"}
              </button>
            </footer>
          </form>
        </div>
      </section>
    </main>
  );
}
