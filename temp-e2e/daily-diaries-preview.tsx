import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DailyDiariesList } from "../app/app/daily-diaries/daily-activities/components/DailyDiariesList";
import "../app/globals.css";

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    <DailyDiariesList />
  </QueryClientProvider>
);
