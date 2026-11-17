"use client";

import { useProjectList } from "@/app/app/master-data/projects/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useProjectDiarySummaries } from "../hooks/useProjectDiarySummaries";
import { summarizeProjectDiaries } from "../project-diary-summary";
import { ProjectCard } from "./ProjectCard";
import { ProjectRow } from "./ProjectRow";

const PAGE_SIZE = 100;

export function DailyDiariesList() {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const filters = useMemo(
    () => ({
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined
    }),
    [debouncedSearch]
  );
  const { data, isLoading, isError, refetch } = useProjectList(filters);
  const diaries = useProjectDiarySummaries(Boolean(data?.items.length));
  const summaries = useMemo(() => {
    const grouped = new Map<string, DailyDiariesItem[]>();
    for (const diary of diaries.data ?? []) {
      const records = grouped.get(diary.project_id) ?? [];
      records.push(diary);
      grouped.set(diary.project_id, records);
    }
    return new Map(
      (data?.items ?? []).map((project) => [
        project.id,
        summarizeProjectDiaries(project, grouped.get(project.id) ?? [])
      ])
    );
  }, [data?.items, diaries.data]);
  const loading =
    isLoading || (Boolean(data?.items.length) && diaries.isPending);
  const failed = isError || (Boolean(data?.items.length) && diaries.isError);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  return (
    <div className="pb-6">
      <header className="mb-5">
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="h-7 w-5 shrink-0 p-0 hover:bg-neutral-100"
            aria-label="Go back"
          >
            <Image
              src="/images/daily-diaries/back.svg"
              alt=""
              width={20}
              height={20}
            />
          </Button>
          <h1 className="text-xl font-semibold leading-7 text-gray-950">
            Daily Diaries
          </h1>
        </div>
        <p className="ml-[30px] text-sm leading-5 text-neutral-500">
          Select Project and Date before viewing or editing Daily Diary.
        </p>
      </header>

      <div className="mb-5 flex items-center gap-2.5">
        <div className="relative min-w-0 flex-1">
          <Image
            src="/images/daily-diaries/search.svg"
            alt=""
            width={16}
            height={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Project"
            aria-label="Search projects"
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9.5 pr-3 text-sm shadow-xs"
          />
        </div>

        <div
          role="group"
          className="flex h-10 shrink-0 items-center rounded-lg border border-neutral-200 bg-white px-1.5 shadow-xs"
          aria-label="Project view"
        >
          <div className="flex rounded-[10px] bg-neutral-100 p-[3px]">
            {(["grid", "list"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={cn(
                  "flex h-6 w-10 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primary-500",
                  view === option ? "bg-white shadow-sm" : "hover:bg-white/50"
                )}
                aria-label={`${option} view`}
                aria-pressed={view === option}
              >
                <Image
                  src={`/images/daily-diaries/${option}.svg`}
                  alt=""
                  width={16}
                  height={16}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {failed ? (
        <div
          role="alert"
          className="rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center"
        >
          <p className="text-sm font-medium text-neutral-700">
            {isError
              ? "Unable to load projects"
              : "Unable to load diary summaries"}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              if (isError) void refetch();
              else void diaries.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div
          role="status"
          aria-label="Loading daily diaries"
          className="flex h-100 items-center justify-center"
        >
          <Spinner className="size-10 text-primary" />
        </div>
      ) : !data?.items?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">
            No projects found
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Try another project name or code.
          </p>
        </div>
      ) : (
        <section
          aria-label="Projects"
          className={cn(
            view === "grid"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "space-y-4"
          )}
        >
          {data.items.map((project) =>
            view === "grid" ? (
              <ProjectCard
                key={project.id}
                project={project}
                summary={summaries.get(project.id)!}
              />
            ) : (
              <ProjectRow
                key={project.id}
                project={project}
                summary={summaries.get(project.id)!}
              />
            )
          )}
        </section>
      )}
    </div>
  );
}
