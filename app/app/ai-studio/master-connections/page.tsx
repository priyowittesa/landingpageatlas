import { Suspense } from "react";
import { MasterConnectionList } from "./components/master-connection-list";

export default function MasterConnectionsPage() {
  return <Suspense><MasterConnectionList /></Suspense>;
}
