import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, Loader2, Moon, Sparkles, Sun, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExcuseLoadingCard } from "@/components/ojuhat/ExcuseLoadingCard";
import { ResultCard } from "@/components/ojuhat/ResultCard";
import { StatsCards } from "@/components/ojuhat/StatsCards";
import { WelcomeModal } from "@/components/ojuhat/WelcomeModal";
import { fireExcuseConfetti } from "@/lib/confetti";
import { generateExcuseWithGemini } from "@/lib/gemini-excuse";
import mascot from "@/assets/mascot.png";
import {
  PROBLEMS,
  TARGETS,
  TONES,
  excuseOfTheDay,
  formatCustomExcuseBadge,
  generateSmartLocalExcuse,
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

const SEO_TITLE = "Ojuhat Factory | অজুহাত ফ্যাক্টরি - মজার বাংলা অজুহাত জেনারেটর";
const SEO_DESCRIPTION =
  "অজুহাত ফ্যাক্টরি (Ojuhat Factory) — বাংলাদেশের সেরা মজার বাংলা অজুহাত জেনারেটর! Generate witty, realistic & funny Bengali excuses for boss, teacher, friends, family & partner in one click.";
const SEO_IMAGE = "/assets/aistudio/1000012711-removebg-preview_cac0c2f6.png";

const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Ojuhat Factory | অজুহাত ফ্যাক্টরি",
  alternateName: ["অজুহাত ফ্যাক্টরি", "Ojuhat Factory", "Bengali Excuse Generator"],
  inLanguage: ["bn", "en"],
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "All",
  url: "https://vercel.app/",
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
      {
        name: "keywords",
        content:
          "অজুহাত ফ্যাক্টরি, Ojuhat Factory, মজার অজুহাত জেনারেটর, বাংলা অজুহাত জেনারেটর, Bengali excuse generator, Bangla excuse generator, অফিসের অজুহাত, ক্লাসের অজুহাত",
      },
      { property: "og:title", content: SEO_TITLE },
      { property: "og:description", content: SEO_DESCRIPTION },
      { property: "og:image", content: SEO_IMAGE },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Ojuhat Factory | অজুহাত ফ্যাক্টরি" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO_TITLE },
      { name: "twitter:description", content: SEO_DESCRIPTION },
      { name: "twitter:image", content: SEO_IMAGE },
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
  "h-13 sm:h-14 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200/90 bg-white/80 pl-4 pr-11 text-sm sm:text-base font-medium text-foreground shadow-xs backdrop-blur-md outline-none transition-all duration-200 ease-out hover:border-primary/45 hover:bg-white hover:shadow-[0_0_0_3px_rgba(249,115,22,0.08)] focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(249,115,22,0.16),0_10px_24px_-10px_rgba(249,115,22,0.28)] dark:border-white/12 dark:bg-slate-900/75 dark:hover:border-primary/50 dark:hover:bg-slate-900/90 dark:focus:bg-slate-900";

function enterDelay(ms: number): CSSProperties {
  return { "--enter-delay": `${ms}ms` } as CSSProperties;
}

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
  const [customSituation, setCustomSituation] = useState("");
  const [result, setResult] = useState<GeneratedExcuse | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
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

  const generate = async (scroll = true) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setIsStreaming(false);

    if (scroll && typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }

    let hasReceivedFirstChunk = false;
    const trimmedCustom = customSituation.trim();
    const previousMessage = scroll ? undefined : result?.message;

    try {
      const generated = await generateExcuseWithGemini(
        {
          target,
          problem,
          tone,
          customText: customSituation,
          previousMessage,
        },
        {
          onChunk: (partialMessage) => {
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              setIsStreaming(true);
              setResultKey((prev) => prev + 1);
            }
            setResult({
              id: "streaming",
              target,
              tone,
              ...(trimmedCustom ? { customBadge: formatCustomExcuseBadge(tone) } : {}),
              message: partialMessage,
              score: tone === "funny" ? 28 : tone === "emotional" ? 76 : 85,
              tip: "",
            });
          },
        },
      );

      if (!hasReceivedFirstChunk) {
        setResultKey((prev) => prev + 1);
      }
      setIsStreaming(false);
      setResult(generated);

      if (scroll) {
        fireExcuseConfetti();
        setExcusesCount((prev) => prev + 1);
        void recordExcuseGenerated().then(setExcusesCount);
      }
    } catch {
      const fallback = generateSmartLocalExcuse({
        target,
        problem,
        tone,
        customText: customSituation,
        previousMessage,
      });
      if (!hasReceivedFirstChunk) {
        setResultKey((prev) => prev + 1);
      }
      setIsStreaming(false);
      setResult(fallback);
      if (scroll) {
        fireExcuseConfetti();
        setExcusesCount((prev) => prev + 1);
        void recordExcuseGenerated().then(setExcusesCount);
      }
    } finally {
      setIsStreaming(false);
      setIsGenerating(false);
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

  const openExternalTab = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whatsapp = () => {
    if (!result) return;
    openExternalTab(`https://wa.me/?text=${encodeURIComponent(result.message)}`);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col overflow-x-clip px-3.5 pb-8 pt-5 sm:px-6 sm:pt-7 lg:max-w-5xl lg:px-8">
      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />

      <header
        className="navbar-glass animate-enter sticky top-2.5 z-40 flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2 transition-all duration-200 sm:top-3.5 sm:gap-4 sm:rounded-3xl sm:px-5 sm:py-2.5"
        style={enterDelay(0)}
      >
        <a
          href="/"
          aria-label="অজুহাত ফ্যাক্টরি"
          className="group flex min-w-0 shrink-0 items-center gap-2 rounded-xl py-0.5 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3"
        >
          <div className="shrink-0 rounded-xl transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3 dark:bg-white/92 dark:p-1 dark:shadow-xs dark:ring-1 dark:ring-white/20">
            <img
              src="/assets/aistudio/1000012711-removebg-preview_cac0c2f6.png"
              alt="অজুহাত ফ্যাক্টরি লোগো"
              width={500}
              height={500}
              loading="eager"
              decoding="async"
              className="h-9 w-auto object-contain sm:h-11"
            />
          </div>
          <h1 className="truncate font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            অজুহাত ফ্যাক্টরি
          </h1>
        </a>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden items-center whitespace-nowrap rounded-full border border-sky-200/80 bg-sky-50/85 px-2.5 py-1 text-[11px] font-bold text-sky-700 backdrop-blur-md min-[380px]:inline-flex sm:px-3.5 sm:py-1.5 sm:text-xs dark:border-sky-400/20 dark:bg-sky-500/12 dark:text-sky-300">
            ১,০০০+ অজুহাত
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
            title={isDark ? "লাইট মোড" : "ডার্ক মোড"}
            className="luxury-glass-subtle flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-foreground shadow-xs transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:scale-105 hover:border-primary/45 active:translate-y-0 active:scale-90 active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-10.5 sm:rounded-2xl"
          >
            {isDark ? (
              <Sun className="size-4.5 text-amber-400 transition-transform duration-300 sm:size-5" />
            ) : (
              <Moon className="size-4.5 text-primary transition-transform duration-300 sm:size-5" />
            )}
          </button>
        </div>
      </header>

      <main className="mt-5 flex-1 lg:mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Left column: Hero intro + Excuse generator form */}
        <div className="lg:col-span-7">
          <section
            className="luxury-glass animate-enter relative flex items-center gap-3 rounded-3xl p-4 sm:gap-4 sm:p-5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"
            style={enterDelay(70)}
          >
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold tracking-wide text-primary sm:text-[13px]">
                এখানে যত্ন সহকারে নিখুঁত অজুহাত তৈরি করা হয় 🏭
              </p>
              <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-balance sm:text-[30px] lg:text-[34px]">
                ঝামেলায় পড়েছেন? <span className="text-teal">চিন্তা নেই!</span>
              </h2>
              <p className="mt-1.5 text-sm leading-[1.75] text-muted-foreground sm:text-[15px]">
                তিনটি জিনিস বেছে নিন, বাকিটা আমাদের মাথা খাটানোর দায়িত্ব।
              </p>
            </div>
            <div className="animate-enter shrink-0" style={enterDelay(110)}>
              <img
                src={mascot}
                alt="হাতে বাতি নিয়ে দুষ্টু হাসি দেওয়া একটি চরিত্র"
                width={816}
                height={816}
                className="animate-float w-24 sm:w-32 lg:w-36"
              />
            </div>
          </section>

          <form
            className="luxury-glass animate-enter mt-4 space-y-4 rounded-3xl p-4 transition-shadow duration-200 hover:shadow-[0_24px_50px_-20px_rgba(15,23,42,0.18)] sm:space-y-5 sm:p-6 lg:mt-5"
            style={enterDelay(140)}
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
          >
            <Field label="কার জন্য অজুহাত?">
              <div className="group relative">
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
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-transform duration-200 group-hover:text-primary group-focus-within:rotate-180 group-focus-within:text-primary" />
              </div>
            </Field>

            <Field label="কী সমস্যা হয়েছে?">
              <div className="group relative">
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
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-transform duration-200 group-hover:text-primary group-focus-within:rotate-180 group-focus-within:text-primary" />
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
                      className={`group flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2.5 text-center backdrop-blur-md transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:translate-y-0 active:scale-[0.93] active:duration-100 sm:px-2 sm:py-3 ${
                        active
                          ? "scale-[1.02] border-primary/85 bg-gradient-to-b from-orange-500/12 to-amber-500/8 text-foreground shadow-[0_0_0_3px_rgba(249,115,22,0.14),0_10px_24px_-10px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 dark:from-orange-500/18 dark:to-amber-500/10"
                          : "border-slate-200/90 bg-white/75 text-muted-foreground shadow-xs hover:-translate-y-1 hover:scale-[1.015] hover:border-primary/45 hover:bg-white hover:text-foreground hover:shadow-[0_10px_24px_-8px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900/55 dark:hover:border-primary/45 dark:hover:bg-slate-900/80"
                      }`}
                    >
                      <span
                        className={`text-xl transition-transform duration-200 sm:text-2xl ${
                          active ? "scale-110" : "group-hover:scale-110"
                        }`}
                      >
                        {t.emoji}
                      </span>
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

            <div className="border-t border-slate-200/75 pt-4 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="custom-situation-input"
                  className="block text-sm font-bold sm:text-[15px]"
                >
                  নিজের পরিস্থিতি লিখুন (ঐচ্ছিক)
                </label>
                {customSituation.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomSituation("")}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-3.5" /> মুছুন
                  </button>
                )}
              </div>
              <textarea
                id="custom-situation-input"
                value={customSituation}
                onChange={(e) => setCustomSituation(e.target.value)}
                rows={3}
                maxLength={240}
                placeholder="অথবা আপনার নিজের পরিস্থিতি লিখুন... (যেমন: বসের কাছে দেরির অজুহাত বা বন্ধুকে পচানো)"
                className="w-full resize-none rounded-2xl border border-slate-200/90 bg-white/80 p-3.5 text-sm leading-[1.75] text-foreground shadow-xs backdrop-blur-md outline-none transition-all duration-200 ease-out placeholder:text-muted-foreground/75 hover:border-primary/45 hover:bg-white focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(249,115,22,0.16),0_10px_24px_-10px_rgba(249,115,22,0.25)] dark:border-white/12 dark:bg-slate-900/70 dark:hover:border-primary/50 dark:hover:bg-slate-900/85 dark:focus:bg-slate-900 sm:p-4 sm:text-base"
              />
              <p className="mt-2 text-xs leading-[1.7] text-muted-foreground">
                {customSituation.trim()
                  ? "আপনার লেখা পরিস্থিতিকেই সর্বোচ্চ অগ্রাধিকার দিয়ে সরাসরি উত্তর তৈরি হবে ✨"
                  : "খালি রাখলে উপরের সিলেক্ট করা ক্যাটাগরি অনুযায়ী অজুহাত তৈরি হবে।"}
              </p>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="xl"
              disabled={isGenerating}
              className="h-14 w-full text-base sm:h-16 sm:text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>AI অজুহাত তৈরি করছে...</span>
                </>
              ) : (
                "সেরা অজুহাত তৈরি করুন ✨"
              )}
            </Button>
          </form>
        </div>

        {/* Right column: Generated Result Card + Excuse of the Day */}
        <div className="mt-6 space-y-6 lg:sticky lg:top-6 lg:col-span-5 lg:mt-0">
          <div ref={resultRef} className="scroll-mt-4">
            {isGenerating && !isStreaming ? (
              <ExcuseLoadingCard />
            ) : result ? (
              <ResultCard
                result={result}
                animationKey={resultKey}
                isGenerating={isGenerating}
                isStreaming={isStreaming}
                onCopy={copy}
                onAnother={() => void generate(false)}
                onWhatsApp={whatsapp}
              />
            ) : (
              <div
                className="luxury-glass luxury-card-hover animate-enter hidden flex-col items-center justify-center rounded-3xl p-7 text-center lg:flex"
                style={enterDelay(170)}
              >
                <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Wand2 className="size-7" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
                  আপনার অজুহাত এখানে তৈরি হবে
                </h2>
                <p className="mt-2 text-sm leading-[1.8] text-muted-foreground">
                  বাম দিকের ফর্ম থেকে অপশন বেছে নিন অথবা নিজের পরিস্থিতি লিখে বাটনে ক্লিক করুন—মুহূর্তেই AI
                  দিয়ে নতুন অজুহাত ও শেয়ারযোগ্য কার্ড রেডি হয়ে যাবে!
                </p>
              </div>
            )}
          </div>

          {daily && (
            <section
              className="luxury-card-hover animate-enter overflow-hidden rounded-3xl border border-white/15 bg-gradient-day p-5 text-white shadow-card sm:p-6"
              style={enterDelay(210)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 shrink-0 text-sky-300" />
                <h2 className="font-display text-2xl font-bold tracking-tight">আজকের সেরা অজুহাত</h2>
              </div>
              <p className="mt-3 text-[15px] leading-[1.8] text-slate-100 sm:text-base">
                “{daily.text}”
              </p>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-sky-200/90">
                প্রতিদিন নতুন একটি — কাল আবার দেখে যাবেন!
              </p>
            </section>
          )}

          <div className="animate-enter" style={enterDelay(250)}>
            <StatsCards visitors={visitorsCount} excusesCount={excusesCount} />
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-8 text-center lg:pt-12">
        <details className="luxury-glass-subtle group mx-auto mb-6 max-w-3xl rounded-2xl px-5 py-3.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-foreground sm:text-base">
            <span>অজুহাত ফ্যাক্টরি কী? (About Ojuhat Factory)</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-2.5 border-t border-slate-200/75 pt-3 text-xs leading-[1.8] text-muted-foreground dark:border-white/10 sm:text-sm">
            <p>
              <strong className="font-semibold text-foreground">
                অজুহাত ফ্যাক্টরি (Ojuhat Factory)
              </strong>{" "}
              হলো বাংলাদেশের সবচেয়ে জনপ্রিয় ও স্মার্ট{" "}
              <strong className="font-semibold text-foreground">মজার অজুহাত জেনারেটর</strong>। অফিসের
              বস, ক্লাসের শিক্ষক, বাবা-মা, বন্ধু কিংবা ভালোবাসার মানুষের জন্য যেকোনো পরিস্থিতিতে এক ক্লিকে
              বিশ্বাসযোগ্য, হাস্যকর বা আবেগঘন বাংলা অজুহাত তৈরি করতে পারবেন।
            </p>
            <p>
              Looking for a witty{" "}
              <strong className="font-semibold text-foreground">Bengali excuse generator</strong>?
              Ojuhat Factory combines AI with Bangladeshi daily-life humor—covering traffic jams,
              load-shedding, missed calls, assignments, office leave, and custom personal
              situations—so you can copy, share on WhatsApp or Messenger, or download a shareable
              excuse card instantly.
            </p>
            <p>
              নিজের নির্দিষ্ট কোনো পরিস্থিতি বাংলায় লিখে দিলেই অজুহাত ফ্যাক্টরি আপনার জন্য একদম প্রাসঙ্গিক ও
              স্বাভাবিক বাংলাদেশি বাংলায় নতুন অজুহাত তৈরি করে দেয়।
            </p>
          </div>
        </details>

        <p className="text-xs leading-[1.7] text-muted-foreground sm:text-sm">
          ⚠️ শুধুমাত্র বিনোদনের জন্য তৈরি। ধরা পড়লে কর্তৃপক্ষ দায়ী নয়!
        </p>
        <p className="mt-1 font-display text-lg font-bold text-primary">অজুহাত ফ্যাক্টরি</p>
        <div className="luxury-glass luxury-card-hover mx-auto mt-4 max-w-xs rounded-2xl px-4 py-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            তৈরি করেছেন
          </p>
          <p className="mt-1 font-display text-xl font-bold leading-snug text-foreground">
            Motasim Billah Tamim
          </p>
          <p className="mt-0.5 text-xs font-semibold text-primary">CEO · অজুহাত ফ্যাক্টরি</p>
        </div>
      </footer>
    </div>
  );
}
