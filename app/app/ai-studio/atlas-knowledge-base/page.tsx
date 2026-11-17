import { Suspense } from "react";
import { KnowledgeBaseWorkspace } from "./components/knowledge-base-workspace";

export default function AtlasKnowledgeBasePage() {
  return <Suspense><KnowledgeBaseWorkspace /></Suspense>;
}
