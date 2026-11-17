"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialProducts } from "../data";
import { StatusBadge } from "../components/product-list";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const product = initialProducts.find((item) => item.id === id) ?? initialProducts[0];
  return <div className="mx-auto max-w-7xl space-y-4 pb-10">
    <div className="flex items-center justify-between"><button onClick={() => router.push("/app/inspection/products")} className="inline-flex items-center gap-1.5 text-lg font-bold text-gray-900"><ArrowLeft className="h-4 w-4" />{product.partName}</button><div className="flex gap-2"><Button size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="destructive" className="gap-1.5"><Trash2 className="h-3.5 w-3.5" />Delete</Button></div></div>
    <Card><CardHeader><CardTitle className="text-sm">Product Details</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Part Number" value={product.partNumber} /><Detail label="Category" value={product.category} /><Detail label="Part Name" value={product.partName} /><div><p className="text-[10px] font-medium uppercase text-gray-500">Status</p><div className="mt-1"><StatusBadge status={product.status} /></div></div><Detail label="Revision" value={product.revision} /><Detail label="Drawing(s)" value={product.drawings} /></CardContent></Card>
    <HistoryCard /><TemplatesCard />
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-medium uppercase text-gray-500">{label}</p><p className="mt-1 text-sm font-medium text-gray-800">{value}</p></div>; }
function HistoryCard() { const rows = [["INS-2026-0451", "Jul 29, 2026", "Incoming Inspection", "PASS", "John Smith"], ["INS-2026-0380", "Jul 15, 2026", "Final Assembly Check", "PASS", "Sarah Lee"], ["INS-2026-0295", "Jun 30, 2026", "Incoming Inspection", "FAIL", "John Smith"]]; return <Card><CardHeader><CardTitle className="text-sm">Quality Inspection History</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table className="min-w-175"><TableHeader><TableRow>{["Inspection ID", "Date", "Template Name", "Result", "Inspector"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row[0]}>{row.map((value, index) => <TableCell key={value}>{index === 3 ? <span className={value === "PASS" ? "rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700" : "rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600"}>{value}</span> : value}</TableCell>)}</TableRow>)}</TableBody></Table></CardContent></Card>; }
function TemplatesCard() { const rows = [["QT-001", "Incoming Inspection", "Rev B"], ["QT-015", "Final Assembly Check", "Rev A"]]; return <Card><CardHeader><CardTitle className="text-sm">Linked Quality Templates</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table className="min-w-150"><TableHeader><TableRow>{["Template ID", "Template Name", "Revision", "Status"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row[0]}><TableCell>{row[0]}</TableCell><TableCell>{row[1]}</TableCell><TableCell>{row[2]}</TableCell><TableCell><span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ACTIVE</span></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>; }
