import { Suspense } from "react";
import { BreakdownList } from "./breakdown-list";
export default function Page(){ return <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading breakdowns...</div>}><BreakdownList/></Suspense>; }
