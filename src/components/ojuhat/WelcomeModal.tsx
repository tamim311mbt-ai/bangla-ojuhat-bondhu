import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby="welcome-modal-desc"
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-card shadow-card outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Warm theme top accent bar */}
          <div className="h-2.5 w-full bg-gradient-cta" />

          {/* Top-right close (X) button */}
          <DialogPrimitive.Close
            aria-label="পপআপ বন্ধ করুন"
            className="absolute right-3.5 top-5 flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center sm:px-8 sm:pb-8">
            <DialogPrimitive.Title className="font-display text-4xl leading-tight text-primary sm:text-[42px]">
              অভিনন্দন! 🎉
            </DialogPrimitive.Title>

            <p id="welcome-modal-desc" className="mt-1 text-sm font-medium text-muted-foreground">
              অজুহাত ফ্যাক্টরিতে আপনাকে স্বাগতম
            </p>

            {/* Circular profile image */}
            <div className="relative mt-5">
              <div className="size-32 overflow-hidden rounded-full border-4 border-primary/25 bg-white shadow-card ring-4 ring-primary-glow/25 sm:size-36">
                {imageError ? (
                  <div className="flex size-full items-center justify-center bg-secondary font-display text-4xl text-primary">
                    Tamim
                  </div>
                ) : (
                  <img
                    src={PROFILE_IMAGE_SRC}
                    alt="Motasim Billah Tamim"
                    width={400}
                    height={400}
                    onError={() => setImageError(true)}
                    className="size-full object-cover object-top"
                  />
                )}
              </div>
            </div>

            {/* Name and designation */}
            <div className="mt-4">
              <h2 className="font-display text-2xl leading-snug text-foreground sm:text-[26px]">
                Motasim Billah Tamim
              </h2>
              <p className="mt-0.5 text-sm font-bold text-primary">CEO · অজুহাত ফ্যাক্টরি</p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex w-full flex-col gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1877F2] px-5 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-[#166FE5] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5 shrink-0"
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
                className="h-12 w-full rounded-2xl text-[15px] font-bold"
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
