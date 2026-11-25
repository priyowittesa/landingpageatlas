import { Boxes } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { CONNECTIONS, WORKFLOWS } from "../workflows/data";
import { ConnectionsBoard } from "./components/ConnectionsBoard";

export default function MasterConnectionsPage() {
  return (
    <div className="space-y-8">
      <ScreenHeader
        icon={Boxes}
        title="Master Connection"
        subtitle="The client systems ATLAS reads and writes. Switch one off to see which workflows stop."
      />
      <ConnectionsBoard connections={CONNECTIONS} workflows={WORKFLOWS} />
    </div>
  );
}
