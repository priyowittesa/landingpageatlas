import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const vitestRequire = createRequire(require.resolve("vitest/package.json"));
const { createServer } = await import(pathToFileURL(vitestRequire.resolve("vite")).href);
const root = process.cwd().replaceAll("\\", "/");
const projects = [0, 1, 2].map((index) => ({
  id: `project-${index}`, code: `AP083${index + 4}`,
  title: "BHP Newman West Water", start_date: "2026-01-01",
  end_date: "2026-12-31", status: "active", progress: [0, 34, 100][index]
}));
const records = [];
for (const [index, counts] of [[1, [120, 80, 45, 10]], [2, [230, 80, 45, 10]]]) {
  let day = 0;
  for (const [statusIndex, count] of counts.entries()) {
    for (let n = 0; n < count; n += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day++)).toISOString().slice(0, 10);
      records.push({
        id: `${index}-${day}`, project_id: `project-${index}`, diary_date: date,
        status: ["DIARY_STATUS_APPROVED", "DIARY_STATUS_SUBMITTED", "DIARY_STATUS_DRAFT", "DIARY_STATUS_REJECTED"][statusIndex],
        updated_at: `${date}T12:00:00Z`
      });
    }
  }
}
let failDiaries = false;
let diaryRequests = 0;
const server = await createServer({
  root, configFile: false, server: { host: "127.0.0.1", port: 4178, strictPort: true },
  resolve: { alias: { "@": root } },
  esbuild: { jsx: "automatic" },
  plugins: [{
    name: "daily-diaries-isolated-fixture", enforce: "pre",
    resolveId(id) {
      if (["next/image", "next/link", "next/navigation"].includes(id)) return `\0fixture:${id}`;
      if (id.endsWith("/master-data/projects/use-projects")) return "\0fixture:projects";
      if (id === "@/lib/axios" || id === `${root}/lib/axios`) return "\0fixture:axios";
      if (id === "@/lib/env" || id === `${root}/lib/env`) return "\0fixture:env";
    },
    load(id) {
      if (id === "\0fixture:next/image") return `import React from "react"; export default function Image(p){return React.createElement("img",p)}`;
      if (id === "\0fixture:next/link") return `import React from "react"; export default function Link(p){return React.createElement("a",p)}`;
      if (id === "\0fixture:next/navigation") return `export const useRouter=()=>({back:()=>history.back()});`;
      if (id === "\0fixture:env") return `export const env={apiBaseUrl:""};`;
      if (id === "\0fixture:axios") return `import axios from "axios"; export const axiosConfig=()=>axios.create();`;
      if (id === "\0fixture:projects") return `
        import {useQuery} from "@tanstack/react-query";
        export function useProjectList(filters) {return useQuery({
          queryKey:["projects",filters],queryFn:async()=>{
            const res=await fetch("/fixture/projects?search="+encodeURIComponent(filters.search||""));
            if(!res.ok)throw new Error("Unable to load projects");return res.json();
          }});}
      `;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        const send = (body, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (url.pathname === "/fixture/control") {
          failDiaries = url.searchParams.get("fail") === "true";
          return send({ diaryRequests });
        }
        if (url.pathname === "/fixture/projects") {
          const search = url.searchParams.get("search").toLowerCase();
          if (search === "error") return send({}, 500);
          return send({ items: projects.filter(p => `${p.code} ${p.title}`.toLowerCase().includes(search)) });
        }
        if (url.pathname === "/v1/construction-diary/diaries") {
          diaryRequests += 1;
          if (failDiaries) return send({}, 500);
          const start = Number(url.searchParams.get("page_token") || 0);
          const end = start + 100;
          return send({
            items: records.slice(start, end),
            next_page_token: end < records.length ? String(end) : "",
            total_count: records.length
          });
        }
        next();
      });
    }
  }]
});
await server.listen();
console.log("Daily Diaries fixture ready at http://127.0.0.1:4178/temp-e2e/daily-diaries-preview.html");
