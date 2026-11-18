import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const LOGO_IMAGE_SRC = "/assets/aistudio/1000012711-removebg-preview_cac0c2f6.png";
const PROFILE_IMAGE_SRC =
  "/assets/aistudio/790269062_1535420101716234_8697366622366980741_n__1__a93d140c.jpg";
const FACEBOOK_URL = "https://www.facebook.com/pixelmbt";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <DialogPrimitive.Content
          aria-describedby="welcome-modal-desc"
          className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card text-card-foreground shadow-card outline-none data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out sm:w-[calc(100%-2rem)]"
        >
          {/* Warm theme top accent bar */}
          <div className="sticky top-0 z-10 h-2.5 w-full bg-gradient-cta" />

          {/* Top-right close (X) button */}
          <DialogPrimitive.Close
            aria-label="পপআপ বন্ধ করুন"
            className="absolute right-3 top-4 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted/90 text-muted-foreground transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:bg-secondary hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-3.5 sm:top-5"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          <div className="flex flex-col items-center px-5 pb-5 pt-5 text-center sm:px-8 sm:pb-7 sm:pt-6">
            <DialogPrimitive.Title className="pr-6 font-display text-3xl font-bold leading-tight text-primary sm:pr-0 sm:text-[38px]">
              অভিনন্দন! 🎉
            </DialogPrimitive.Title>

            <p
              id="welcome-modal-desc"
              className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm"
            >
              অজুহাত ফ্যাক্টরিতে আপনাকে স্বাগতম
            </p>

            {/* Main Center Brand Logo */}
            <div className="mt-3 flex justify-center sm:mt-4">
              <div className="rounded-3xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 dark:bg-[#FFF9F0]/95 dark:p-2 dark:shadow-sm dark:ring-1 dark:ring-white/15">
                <img
                  src={LOGO_IMAGE_SRC}
                  alt="অজুহাত ফ্যাক্টরি লোগো"
                  width={500}
                  height={500}
                  className="h-auto w-[130px] object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.14)] sm:w-[146px]"
                />
              </div>
            </div>

            {/* Compact Horizontal Pill Founder Badge */}
            <div className="mt-3.5 inline-flex max-w-full items-center gap-3 rounded-full border border-slate-200/90 bg-[#F8FAFC] py-1.5 pl-1.5 pr-4 shadow-xs sm:mt-4 dark:border-border dark:bg-secondary/75">
              <div className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-primary/25 bg-white shadow-xs">
                {imageError ? (
                  <div className="flex size-full items-center justify-center bg-secondary text-sm font-bold text-primary">
                    T
                  </div>
                ) : (
                  <img
                    src={PROFILE_IMAGE_SRC}
                    alt="Motasim Billah Tamim"
                    width={88}
                    height={88}
                    onError={() => setImageError(true)}
                    className="size-full object-cover object-top"
                  />
                )}
              </div>
              <div className="min-w-0 text-left">
                <h2 className="truncate font-sans text-sm font-bold leading-tight text-slate-900 sm:text-[15px] dark:text-foreground">
                  Motasim Billah Tamim
                </h2>
                <p className="mt-0.5 truncate text-xs font-semibold leading-tight text-primary">
                  CEO • অজুহাত ফ্যাক্টরি
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex w-full flex-col gap-2.5 sm:mt-5 sm:gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-4 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.025] hover:bg-[#166FE5] hover:shadow-md active:scale-[0.95] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 sm:h-12 sm:gap-2.5 sm:px-5 sm:text-[15px]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4 shrink-0 sm:size-5"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>Follow on Facebook</span>
              </a>

              <Button
                type="button"
                variant="cta"
                size="action"
                onClick={() => onOpenChange(false)}
                className="h-11 w-full rounded-2xl text-sm font-bold sm:h-12 sm:text-[15px]"
              >
                <span>ওয়েবসাইটে প্রবেশ করুন</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
