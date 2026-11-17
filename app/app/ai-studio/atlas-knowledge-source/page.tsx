import { Suspense } from "react";

import { KnowledgeSourceList } from "./components/knowledge-source-list";

export default function AtlasKnowledgeSourcePage() {
  return (
    <Suspense>
      <KnowledgeSourceList />
    </Suspense>
  );
}
