"use client";
// "Compose a visualization" modal with suggestion chips (mockup 02).
import { useEffect, useRef, useState } from "react";

/**
 * Fixed pool the 5 suggestion chips are drawn from. Written in the register of
 * the mockups: short, concrete, answerable from public data.
 */
const SUGGESTIONS = [
  "Death rates by cause in the US",
  "Ocean plastic accumulation zones",
  "Food insecurity by US state",
  "Small business survival rate by year",
  "Infant mortality rate by country",
  "Global energy mix over the last 50 years",
  "Most streamed songs of the decade",
  "Where the world's fresh water is stored",
  "Box office returns by film genre",
  "Average rent in the ten largest US cities",
  "Antibiotic resistance by pathogen",
  "Household debt by country",
  "Languages spoken at home in the US",
  "Electric vehicle share of new car sales",
  "Coral reef cover lost since 1980",
  "Wildfire acres burned per year in California",
  "Life expectancy by income decile",
  "Undersea cable capacity by route",
  "Screen time by age group",
  "Nobel prizes by country and field",
];

/** Five distinct suggestions, drawn fresh each time the modal opens. */
function pickSuggestions(): string[] {
  const pool = [...SUGGESTIONS];
  const picked: string[] = [];
  while (picked.length < 5 && pool.length > 0) {
    picked.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return picked;
}

interface ComposeModalProps {
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function ComposeModal({ onSubmit, onClose }: ComposeModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Drawn once per mount (HomeShell mounts this only while it is open), so the
  // chips can't reshuffle under the user mid-read.
  const [suggestions] = useState(pickSuggestions);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = () => {
    const prompt = value.trim();
    if (prompt) onSubmit(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      {/* Heavy blur + scrim: the feed stays visible underneath as colour. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-2xl"
      />

      <div className="relative -translate-y-[6vh] w-full max-w-[820px] rounded-2xl border border-white/[0.08] bg-[#242424]/85 px-[26px] pt-[22px] pb-[26px] shadow-[0_28px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <p className="text-ink-muted text-[10.5px] leading-none tracking-[0.18em] uppercase">
          Compose a visualization
        </p>

        <div className="mt-[18px] flex items-center gap-4">
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="What do you want to see?"
            maxLength={500}
            className="text-ink placeholder:text-ink-muted/70 min-w-0 flex-1 border-0 bg-transparent text-[24px] leading-[1.3] outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={value.trim().length === 0}
            aria-label="Start"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d8d7d4] text-[15px] leading-none text-[#161616] transition-opacity hover:bg-white disabled:opacity-35"
          >
            →
          </button>
        </div>

        <div className="mt-[22px] flex flex-wrap gap-[10px] pr-[60px]">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setValue(suggestion);
                inputRef.current?.focus();
              }}
              className="text-ink/80 hover:text-ink rounded-full border border-white/15 px-[13px] py-[7px] text-[13px] leading-none transition-colors hover:border-white/30"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
