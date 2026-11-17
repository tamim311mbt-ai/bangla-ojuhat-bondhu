import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResultCard } from "@/components/ojuhat/ResultCard";
import mascot from "@/assets/mascot.png";
import {
  PROBLEMS,
  TARGETS,
  TONES,
  excuseOfTheDay,
  generateExcuse,
  type Excuse,
  type GeneratedExcuse,
  type Problem,
  type Target,
  type Tone,
} from "@/lib/excuses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "অজুহাত.কম — স্মার্ট অজুহাত জেনারেটর" },
      {
        name: "description",
        content: "বস, শিক্ষক, বাবা-মা, বন্ধু বা ভালোবাসার মানুষের জন্য এক ক্লিকে বিশ্বাসযোগ্য, হাস্যকর বা আবেগঘন বাংলা অজুহাত।",
      },
      { property: "og:title", content: "অজুহাত.কম — স্মার্ট অজুহাত জেনারেটর" },
      { property: "og:description", content: "এক ক্লিকে সেরা বাংলা অজুহাত তৈরি করুন। ধরা পড়লে কর্তৃপক্ষ দায়ী নয়!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const selectClass =
  "h-14 w-full appearance-none rounded-2xl border-2 border-border bg-card pl-4 pr-11 text-base font-medium text-foreground outline-none transition-colors focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-bold">{label}</span>
      {children}
    </label>
  );
}

function Index() {
  const [target, setTarget] = useState<Target>("boss");
  const [problem, setProblem] = useState<Problem>("late");
  const [tone, setTone] = useState<Tone>("real");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState<GeneratedExcuse | null>(null);
  const [daily, setDaily] = useState<Excuse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDaily(excuseOfTheDay()), []);

  const generate = (scroll = true) => {
    const r = generateExcuse({ target, problem, tone, extra, previousId: result?.id });
    setResult(r);
    if (scroll) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.message);
      toast.success("কপি হয়ে গেছে! এবার নির্ভয়ে পাঠিয়ে দিন 😉");
    } catch {
      toast.error("কপি করা গেল না, হাতে সিলেক্ট করে কপি করুন।");
    }
  };

  const whatsapp = () => {
    if (!result) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(result.message)}`, "_blank", "noopener");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-8 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl leading-tight text-primary">অজুহাত.কম</h1>
          <p className="text-sm font-medium text-muted-foreground">স্মার্ট অজুহাত জেনারেটর</p>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
          ৬৮+ অজুহাত
        </span>
      </header>

      <section className="relative mt-4 flex items-center gap-2">
        <div className="flex-1">
          <p className="font-display text-[26px] leading-snug">
            ঝামেলায় পড়েছেন? <span className="text-teal">চিন্তা নেই!</span>
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
            তিনটি জিনিস বেছে নিন, বাকিটা আমাদের মাথা খাটানোর দায়িত্ব।
          </p>
        </div>
        <img src={mascot} alt="হাতে বাতি নিয়ে দুষ্টু হাসি দেওয়া একটি চরিত্র" width={816} height={816} className="animate-float w-32 shrink-0 sm:w-40" />
      </section>

      <form
        className="mt-4 space-y-5 rounded-3xl bg-card p-5 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <Field label="কার জন্য অজুহাত?">
          <div className="relative">
            <select className={selectClass} value={target} onChange={(e) => setTarget(e.target.value as Target)}>
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>

        <Field label="কী সমস্যা হয়েছে?">
          <div className="relative">
            <select className={selectClass} value={problem} onChange={(e) => setProblem(e.target.value as Problem)}>
              {PROBLEMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.emoji} {p.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>

        <fieldset>
          <legend className="mb-2 block text-[15px] font-bold">অজুহাতের ধরন</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TONES.map((t) => {
              const active = tone === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTone(t.value)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-1.5 py-3 text-center transition-all ${
                    active
                      ? "scale-[1.03] border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-[13px] font-bold leading-tight">{t.label}</span>
                  <span className="text-[11px] leading-tight opacity-80">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="অতিরিক্ত কোনো তথ্য যোগ করতে চাইলে লিখুন (ঐচ্ছিক)">
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={2}
            maxLength={160}
            placeholder="যেমন: আজ বাইরে প্রচণ্ড বৃষ্টি হচ্ছে"
            className="w-full resize-none rounded-2xl border-2 border-border bg-card p-4 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
          />
        </Field>

        <Button type="submit" variant="cta" size="xl" className="w-full">
          সেরা অজুহাত তৈরি করুন ✨
        </Button>
      </form>

      <div ref={resultRef} className="scroll-mt-4">
        {result && (
          <div className="mt-6">
            <ResultCard result={result} onCopy={copy} onAnother={() => generate(false)} onWhatsApp={whatsapp} />
          </div>
        )}
      </div>

      {daily && (
        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-day p-5 text-teal-foreground shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5" />
            <h2 className="font-display text-2xl">আজকের সেরা অজুহাত</h2>
          </div>
          <p className="mt-3 text-[16px] leading-relaxed opacity-95">“{daily.text}”</p>
          <p className="mt-3 text-xs font-semibold opacity-80">প্রতিদিন নতুন একটি — কাল আবার দেখে যাবেন!</p>
        </section>
      )}

      <footer className="mt-auto pt-8 text-center">
        <p className="text-sm text-muted-foreground">⚠️ শুধুমাত্র বিনোদনের জন্য তৈরি। ধরা পড়লে কর্তৃপক্ষ দায়ী নয়!</p>
        <p className="mt-1 font-display text-lg text-primary">অজুহাত.কম</p>
        <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-primary/15 bg-card/70 px-4 py-3 shadow-card">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">তৈরি করছিনে</p>
          <p className="mt-1 font-display text-xl leading-snug text-foreground">Motasim Billah Tamim</p>
          <p className="mt-0.5 text-xs font-semibold text-primary">CEO · অজুহাত.কম</p>
        </div>
      </footer>
    </div>
  );
}
