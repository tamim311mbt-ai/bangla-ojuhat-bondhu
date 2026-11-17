import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Moon, Sparkles, Sun, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResultCard } from "@/components/ojuhat/ResultCard";
import { StatsCards } from "@/components/ojuhat/StatsCards";
import { WelcomeModal } from "@/components/ojuhat/WelcomeModal";
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
import {
  BASE_EXCUSES,
  BASE_VISITORS,
  fetchExcuseCount,
  getInitialStats,
  recordExcuseGenerated,
  recordPageVisit,
} from "@/lib/stats";

const SEO_TITLE = "অজুহাত ফ্যাক্টরি (Ojuhat Factory) — স্মার্ট বাংলা অজুহাত জেনারেটর";
const SEO_DESCRIPTION =
  "বস, শিক্ষক, বাবা-মা, বন্ধু বা ভালোবাসার মানুষের জন্য এক ক্লিকে বিশ্বাসযোগ্য, হাস্যকর ও আবেগঘন বাংলা অজুহাত তৈরি করুন ও কার্ড ডাউনলোড করুন।";

const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "অজুহাত ফ্যাক্টরি (Ojuhat Factory)",
  alternateName: "Ojuhat Factory",
  inLanguage: "bn",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "All",
  description: SEO_DESCRIPTION,
  author: {
    "@type": "Person",
    name: "Motasim Billah Tamim",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BDT",
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SEO_TITLE },
      { name: "description", content: SEO_DESCRIPTION },
      { property: "og:title", content: SEO_TITLE },
      { property: "og:description", content: SEO_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "অজুহাত ফ্যাক্টরি (Ojuhat Factory)" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO_TITLE },
      { name: "twitter:description", content: SEO_DESCRIPTION },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: STRUCTURED_DATA,
      },
    ],
  }),
  component: Index,
});

const selectClass =
  "h-13 sm:h-14 w-full appearance-none rounded-2xl border-2 border-border bg-card pl-4 pr-11 text-sm sm:text-base font-medium text-foreground outline-none transition-colors focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold sm:text-[15px]">{label}</span>
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
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [visitorsCount, setVisitorsCount] = useState(BASE_VISITORS);
  const [excusesCount, setExcusesCount] = useState(BASE_EXCUSES);
  const resultRef = useRef<HTMLDivElement>(null);
  const hasTrackedVisitRef = useRef(false);

  useEffect(() => {
    setDaily(excuseOfTheDay());
    setIsDark(document.documentElement.classList.contains("dark"));

    const initial = getInitialStats();
    setVisitorsCount(initial.visitors);
    setExcusesCount(initial.excuses);

    if (!hasTrackedVisitRef.current) {
      hasTrackedVisitRef.current = true;
      void recordPageVisit().then(setVisitorsCount);
      void fetchExcuseCount().then(setExcusesCount);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("ojuhat-theme", nextDark ? "dark" : "light");
    } catch {
      // Ignore storage failures in restricted browsing contexts.
    }
  };

  const generate = (scroll = true) => {
    const r = generateExcuse({ target, problem, tone, extra, previousId: result?.id });
    setResult(r);
    if (scroll) {
      setExcusesCount((prev) => prev + 1);
      void recordExcuseGenerated().then(setExcusesCount);
    }
    if (scroll && typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }
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
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col overflow-x-clip px-3.5 pb-8 pt-5 sm:px-6 sm:pt-7 lg:max-w-5xl lg:px-8">
      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />

      <header className="flex items-center justify-between gap-2 border-b border-border/60 pb-4 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight text-primary sm:text-4xl">
            অজুহাত ফ্যাক্টরি
          </h1>
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            এখানে যত্ন সহকারে নিখুঁত অজুহাত তৈরি করা হয় 🏭
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground sm:inline-flex">
            ৬৮+ অজুহাত
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
            title={isDark ? "লাইট মোড" : "ডার্ক মোড"}
            className="flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-secondary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isDark ? (
              <Sun className="size-5 text-sunny" />
            ) : (
              <Moon className="size-5 text-primary" />
            )}
          </button>
        </div>
      </header>

      <main className="mt-5 flex-1 lg:mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Left column: Hero intro + Excuse generator form */}
        <div className="lg:col-span-7">
          <section className="relative flex items-center gap-3 rounded-3xl bg-card/65 p-4 shadow-sm backdrop-blur-sm sm:gap-4 sm:p-5 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-snug sm:text-[28px] lg:text-[32px]">
                ঝামেলায় পড়েছেন? <span className="text-teal">চিন্তা নেই!</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                তিনটি জিনিস বেছে নিন, বাকিটা আমাদের মাথা খাটানোর দায়িত্ব।
              </p>
            </div>
            <img
              src={mascot}
              alt="হাতে বাতি নিয়ে দুষ্টু হাসি দেওয়া একটি চরিত্র"
              width={816}
              height={816}
              className="animate-float w-24 shrink-0 sm:w-32 lg:w-36"
            />
          </section>

          <form
            className="mt-4 space-y-4 rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:space-y-5 sm:p-6 lg:mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
          >
            <Field label="কার জন্য অজুহাত?">
              <div className="relative">
                <select
                  className={selectClass}
                  value={target}
                  onChange={(e) => setTarget(e.target.value as Target)}
                >
                  {TARGETS.map((t) => (
                    <option key={t.value} value={t.value} className="bg-card text-foreground">
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>

            <Field label="কী সমস্যা হয়েছে?">
              <div className="relative">
                <select
                  className={selectClass}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value as Problem)}
                >
                  {PROBLEMS.map((p) => (
                    <option key={p.value} value={p.value} className="bg-card text-foreground">
                      {p.emoji} {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>

            <fieldset>
              <legend className="mb-2 block text-sm font-bold sm:text-[15px]">অজুহাতের ধরন</legend>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5" role="radiogroup">
                {TONES.map((t) => {
                  const active = tone === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTone(t.value)}
                      className={`flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-2.5 text-center transition-all sm:px-2 sm:py-3 ${
                        active
                          ? "scale-[1.02] border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">{t.emoji}</span>
                      <span className="text-[11px] font-bold leading-tight sm:text-[13px]">
                        {t.label}
                      </span>
                      <span className="text-[10px] leading-tight opacity-80 sm:text-[11px]">
                        {t.hint}
                      </span>
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
                className="w-full resize-none rounded-2xl border-2 border-border bg-card p-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary sm:p-4 sm:text-base"
              />
            </Field>

            <Button
              type="submit"
              variant="cta"
              size="xl"
              className="h-14 w-full text-base sm:h-16 sm:text-lg"
            >
              সেরা অজুহাত তৈরি করুন ✨
            </Button>
          </form>
        </div>

        {/* Right column: Generated Result Card + Excuse of the Day */}
        <div className="mt-6 space-y-6 lg:sticky lg:top-6 lg:col-span-5 lg:mt-0">
          <div ref={resultRef} className="scroll-mt-4">
            {result ? (
              <ResultCard
                result={result}
                onCopy={copy}
                onAnother={() => generate(false)}
                onWhatsApp={whatsapp}
              />
            ) : (
              <div className="hidden flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card/75 p-7 text-center shadow-sm lg:flex">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wand2 className="size-7" />
                </div>
                <h2 className="mt-4 font-display text-2xl text-foreground">
                  আপনার অজুহাত এখানে তৈরি হবে
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  বাম দিকের ফর্ম থেকে প্রাপক, সমস্যা ও ধরন বেছে নিয়ে বাটনে ক্লিক করুন—মুহূর্তেই সেরা অজুহাত ও
                  শেয়ারযোগ্য কার্ড রেডি হয়ে যাবে!
                </p>
              </div>
            )}
          </div>

          {daily && (
            <section className="overflow-hidden rounded-3xl bg-gradient-day p-5 text-teal-foreground shadow-card sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 shrink-0" />
                <h2 className="font-display text-2xl">আজকের সেরা অজুহাত</h2>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed opacity-95 sm:text-base">
                “{daily.text}”
              </p>
              <p className="mt-3 text-xs font-semibold opacity-85">
                প্রতিদিন নতুন একটি — কাল আবার দেখে যাবেন!
              </p>
            </section>
          )}

          <StatsCards visitors={visitorsCount} excusesCount={excusesCount} />
        </div>
      </main>

      <footer className="mt-auto pt-8 text-center lg:pt-12">
        <p className="text-xs text-muted-foreground sm:text-sm">
          ⚠️ শুধুমাত্র বিনোদনের জন্য তৈরি। ধরা পড়লে কর্তৃপক্ষ দায়ী নয়!
        </p>
        <p className="mt-1 font-display text-lg text-primary">অজুহাত ফ্যাক্টরি</p>
        <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-primary/20 bg-card/80 px-4 py-3 shadow-card">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            তৈরি করেছেন
          </p>
          <p className="mt-1 font-display text-xl leading-snug text-foreground">
            Motasim Billah Tamim
          </p>
          <p className="mt-0.5 text-xs font-semibold text-primary">CEO · অজুহাত ফ্যাক্টরি</p>
        </div>
      </footer>
    </div>
  );
}
