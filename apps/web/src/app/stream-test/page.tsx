// Throwaway route: not part of the product. A bare-bones harness for the browser-to-API plumbing
// (lib/stream.ts, lib/run.ts, app/actions.ts). Safe to delete once the real workspace exists.
import { StreamTest } from "./StreamTest";

export default function StreamTestPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-10 py-12 text-neutral-300">
      <h1 className="mb-8 text-sm tracking-[0.2em] text-neutral-400 uppercase">
        Stream test — throwaway route, not product UI
      </h1>
      <StreamTest />
    </main>
  );
}
