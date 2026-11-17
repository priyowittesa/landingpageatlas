"use client";

import { ImageIcon } from "lucide-react";
import { useAttachmentUrl } from "./use-breakdowns";

export function BreakdownPhoto({id,name,url,className="h-20 w-20"}:{id:string;name:string;url?:string;className?:string}){
  const photo=useAttachmentUrl(id,url), source=photo.data;
  return <button type="button" title={`Open ${name}`} disabled={!source} onClick={()=>source&&window.open(source,"_blank","noopener,noreferrer")} className={`group relative shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm outline-none transition hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-default ${className}`}>
    {source?<><span role="img" aria-label={name} className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-105" style={{backgroundImage:`url(${JSON.stringify(source).slice(1,-1)})`}}/><span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">{name}</span></>:<span className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[10px] text-gray-500"><ImageIcon className="h-4 w-4"/>{photo.isLoading?"Loading...":name}</span>}
  </button>;
}
