import Image from "next/image"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type AppLoadingScreenProps = {
  className?: string
  fullScreen?: boolean
  title?: string
  subtitle?: string
  showSurfaceBackdrop?: boolean
}

export function AppLoadingScreen({
  className,
  fullScreen = true,
  title = "Loading your secure workspace",
  subtitle = "Please wait a moment while we prepare the page for you.",
  showSurfaceBackdrop = fullScreen,
}: AppLoadingScreenProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        showSurfaceBackdrop &&
          "bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#111827_55%,_#020617_100%)]",
        fullScreen ? "min-h-[100svh]" : "min-h-0",
        className,
      )}
    >
      {showSurfaceBackdrop ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[10%] h-40 w-40 -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute bottom-[14%] right-[12%] h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute left-[10%] top-[58%] h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl" />
        </div>
      ) : null}

      <div
        className={cn(
          "relative mx-auto flex w-full items-center justify-center px-4 py-4 sm:px-6 sm:py-6",
          fullScreen && "min-h-[100svh]",
        )}
      >
        <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/15 bg-slate-950 p-5 shadow-[0_28px_90px_-40px_rgba(16,185,129,0.65)] sm:p-6">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <div className="xcrow-loader-glow absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
            <div className="xcrow-loader-ring absolute inset-0 rounded-full border border-emerald-200/35 border-t-emerald-200/90" />
            <div className="xcrow-loader-ring-reverse absolute inset-[10px] rounded-full border border-fuchsia-200/30 border-b-fuchsia-200/90" />
            <div className="relative z-10">
              <Image
                src="/logo11xx.png"
                alt="Xcrow"
                width={72}
                height={72}
                priority
                className="h-8 w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-100/85">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure Loading
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="relative h-full w-[42%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-fuchsia-400">
                <span className="xcrow-loader-shimmer absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/85 to-transparent" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-300/85">
              <span>Preparing your next page</span>
              <div className="flex items-center gap-1.5">
                <span className="xcrow-loader-dot h-2 w-2 rounded-full bg-emerald-300" />
                <span className="xcrow-loader-dot h-2 w-2 rounded-full bg-cyan-300" style={{ animationDelay: "0.18s" }} />
                <span className="xcrow-loader-dot h-2 w-2 rounded-full bg-fuchsia-300" style={{ animationDelay: "0.36s" }} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] text-slate-200/75">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Fast route transition</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Protected session checks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
