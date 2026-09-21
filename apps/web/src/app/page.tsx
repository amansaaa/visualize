// Homepage: server-rendered feed of published visualizations. Everything
// interactive (compose modal, streaming modal, workspace) lives in the client
// shell, which renders on top of this feed without ever changing the URL.
import { HomeShell } from "@/components/HomeShell";
import { getPublishedVisualizations } from "@/lib/feed";

// No caching: Cloud Run instances don't share one, and a publish must show up
// on the next load.
export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await getPublishedVisualizations();

  return <HomeShell rows={rows} />;
}
