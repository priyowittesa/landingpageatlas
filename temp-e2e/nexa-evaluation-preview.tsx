import React from "react";
import { createRoot } from "react-dom/client";
import { NexaEvaluationPage } from "../app/app/nexa-evaluation/components/NexaEvaluationPage";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <>
    <aside className="fixed inset-y-0 left-0 hidden w-64 bg-primary-900 p-5 text-white lg:block">
      <div className="text-xl font-bold">ATLAS Altimeda</div>
      <div className="mt-10 text-xs text-white/60">Others</div>
      <div className="mt-2 rounded-lg bg-primary-700 p-2 text-sm">NEXA Evaluation</div>
    </aside>
    <div className="lg:ml-64">
      <header className="border-b bg-gray-50 p-6 text-sm text-gray-500">NEXA Evaluation &middot; Isolated UI Preview</header>
      <main className="mx-auto max-w-7xl p-6"><NexaEvaluationPage /></main>
    </div>
  </>
);
