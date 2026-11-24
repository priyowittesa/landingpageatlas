import type { Metadata } from "next";
import "./ptepi.css";
import { PtepiShell } from "./components/PtepiShell";


export const metadata: Metadata = {
  title: "ATLAS x EPI - Demo",
  robots: { index: false, follow: false }
};

export default function PtepiLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <PtepiShell>{children}</PtepiShell>;
}
