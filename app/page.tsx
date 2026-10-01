"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FastForward, ShieldCheck } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 1. Subtle Executive Acoustic Engine (Zero External Audio Dependencies)    */
/* -------------------------------------------------------------------------- */
class SoftAcousticEngine {
  private ctx: AudioContext | null = null;
  public hasPlayed: boolean = false;

  private init(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public play(volume = 0.28) {
    try {
      const ctx = this.init();
      if (!ctx) return;

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(ctx.destination);

      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      const subFilter = ctx.createBiquadFilter();

      subFilter.type = "lowpass";
      subFilter.frequency.setValueAtTime(110, now);
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(54, now + 0.1);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 3.5);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.45, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(master);
      subOsc.start(now + 0.1);
      subOsc.stop(now + 4.5);

      const chords = [110.0, 164.81, 220.0, 277.18, 329.63, 440.0];

      chords.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(
          freq + (Math.random() - 0.5) * 0.8,
          now
        );

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(1100, now + 2.5);
        filter.frequency.exponentialRampToValueAtTime(360, now + 7.0);

        const delay = 0.2 + i * 0.05;

        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(
          0.06 / Math.sqrt(chords.length),
          now + delay + 0.8
        );
        noteGain.gain.setValueAtTime(
          0.06 / Math.sqrt(chords.length),
          now + 4.5
        );
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.0);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(master);

        osc.start(now + delay);
        osc.stop(now + 8.2);
      });

      this.hasPlayed = true;
    } catch {
      // Safe fallback
    }
  }

  public autoPlay() {
    if (this.hasPlayed) return;
    this.play(0.28);
  }
}

const acousticEngine = new SoftAcousticEngine();

/* -------------------------------------------------------------------------- */
/* 2. Molecular Constellation Background Canvas                               */
/* -------------------------------------------------------------------------- */
function MolecularBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", onResize);

    const count = Math.floor(Math.min(width, 1600) / 28);

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.25 + 0.1,
      color: Math.random() > 0.4 ? "#0D9488" : "#64748B",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 95) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(100, 116, 139, ${
              (1 - dist / 95) * 0.08
            })`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-70"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Main First Page Component (PharmixNetflixIntro)                         */
/* -------------------------------------------------------------------------- */
export default function PharmixNetflixIntro({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  let router: { replace: (url: string) => void } | null = null;

  try {
    router = useRouter();
  } catch {
    // Router fallback for client-side environments outside Next.js app directory
  }

  const brandName = "PHARMIX";

  const [progress, setProgress] = useState(0);
  const [showRibbons, setShowRibbons] = useState(false);
  const [showFlare, setShowFlare] = useState(false);
const [windowWidth, setWindowWidth] = useState<number>(1200);
  const navigateToLogin = () => {
    if (onComplete) {
      onComplete();
    } else if (router) {
      router.replace("/login");
    } else if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth);

  setWindowWidth(window.innerWidth);

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  // Total Duration: 7000ms (7.0 seconds)
  useEffect(() => {
    const duration = 7000;
    const startTime = performance.now();

    acousticEngine.play(0.28);

    const handleInteraction = () => acousticEngine.autoPlay();

    window.addEventListener("pointerdown", handleInteraction, {
      once: true,
    });

    window.addEventListener("mousemove", handleInteraction, {
      once: true,
    });

    window.addEventListener("keydown", handleInteraction, {
      once: true,
    });

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      setProgress(Math.min(100, (elapsed / duration) * 100));
    }, 40);

    const ribbonTimer = setTimeout(() => setShowRibbons(true), 2100);
    const flareTimer = setTimeout(() => setShowFlare(true), 2600);
    const navTimer = setTimeout(
      () => navigateToLogin(),
      duration
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        navigateToLogin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      clearTimeout(ribbonTimer);
      clearTimeout(flareTimer);
      clearTimeout(navTimer);

      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const totalLetters = brandName.length;
  const centerIndex = (totalLetters - 1) / 2;

  const offsetMultiplier =
    windowWidth < 480
      ? 36
      : windowWidth < 768
        ? 58
        : windowWidth < 1024
          ? 88
          : 130;

  const ribbonGradients = [
    "from-teal-600/12 via-teal-500/5 to-transparent",
    "from-slate-700/12 via-slate-400/5 to-transparent",
    "from-teal-700/12 via-teal-600/5 to-transparent",
    "from-sky-700/12 via-sky-500/5 to-transparent",
    "from-teal-800/12 via-teal-600/5 to-transparent",
    "from-slate-600/12 via-slate-400/5 to-transparent",
    "from-teal-700/12 via-teal-500/5 to-transparent",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center overflow-hidden font-sans select-none cursor-default px-4">
      <MolecularBackground />

      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            `radial-gradient(circle at 1.5px 1.5px, #94A3B8 1px, transparent 0)`,
          backgroundSize: "32px 32px",
          WebkitMaskImage:
            "radial-gradient(circle at center, transparent 35%, black 90%)",
          maskImage:
            "radial-gradient(circle at center, transparent 35%, black 90%)",
        }}
      />

      {/* Subtle Green Ambient Radial Wash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: [0, 0.45, 0.3],
          scale: [0.6, 1.2, 1.5],
        }}
        transition={{ duration: 7.0, ease: "easeOut" }}
        className="absolute w-[90vw] max-w-[850px] aspect-square bg-gradient-to-tr from-emerald-400/10 via-teal-300/12 to-slate-300/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"
      />

      {/* Top Header Bar */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-[10px] sm:text-[11px] font-mono text-slate-600 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 shrink-0" />

            <span className="hidden xs:inline">
              PHARMACEUTICAL DEMAND IDENT • SECURE
            </span>

            <span className="xs:hidden">
              PHARMIX SECURE
            </span>
          </span>
        </div>

        <div className="pointer-events-auto">
          <button
            onClick={navigateToLogin}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-white/90 border border-slate-200/90 hover:border-slate-300 text-[11px] sm:text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all duration-200 backdrop-blur-md cursor-pointer shadow-sm active:scale-95"
          >
            <span>Skip Intro</span>

            <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-transform" />

            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-100 text-slate-500 border border-slate-200">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Refractive Light Ribbons */}
      {showRibbons && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-5 overflow-hidden">
          <div className="relative w-full max-w-4xl h-full flex justify-around opacity-60 px-2 sm:px-6">
            {brandName.split("").map((_, i) => (
              <motion.div
                key={`ribbon-${i}`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1.7, 1.1, 0],
                  opacity: [0, 0.65, 0.4, 0],
                  filter: ["blur(4px)", "blur(12px)", "blur(20px)"],
                }}
                transition={{
                  duration: 3.5,
                  delay: i * 0.07,
                  ease: "easeInOut",
                }}
                className={`w-3 xs:w-5 sm:w-10 md:w-14 h-screen bg-gradient-to-b ${
                  ribbonGradients[i % ribbonGradients.length]
                } origin-center`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Specular Flare Sweep */}
      {showFlare && (
        <motion.div
          initial={{
            opacity: 0,
            scaleX: 0.1,
            x: "-100%",
          }}
          animate={{
            opacity: [0, 0.5, 0.3, 0],
            scaleX: [0.1, 2.2, 2.6, 0.1],
            x: ["-100%", "0%", "100%"],
          }}
          transition={{
            duration: 2.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute w-[120vw] h-1 bg-gradient-to-r from-transparent via-white to-transparent blur-[1px] pointer-events-none z-20 shadow-[0_0_20px_3px_rgba(255,255,255,0.85)]"
        />
      )}

      {/* Central Animated Content */}
      <motion.div
        initial={{
          scale: 0.8,
          opacity: 0,
        }}
        animate={{
          scale: [0.8, 1, 1.02, 1, 1.01],
          opacity: [0, 1, 1, 1, 1],
        }}
        transition={{
          duration: 7.0,
          times: [0, 0.25, 0.5, 0.85, 1],
          ease: "easeInOut",
        }}
        className="flex flex-col items-center justify-center z-10 max-w-full"
      >
        {/* LOGO MARK */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 1.6,
            delay: 0.25,
            ease: [0.12, 0.8, 0.2, 1],
          }}
          className="mb-5 sm:mb-8 md:mb-10 relative group"
        >
          <div className="absolute -inset-2 rounded-2xl bg-teal-600/5 blur-lg opacity-80" />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-2 rounded-2xl border border-dashed border-slate-300/60 pointer-events-none"
          />

          <div className="relative w-16 h-16 xs:w-18 xs:h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 bg-white/95 border border-slate-200/90 rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg shadow-slate-200/70 backdrop-blur-xl overflow-hidden">
            <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-slate-300" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-slate-300" />
            <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-slate-300" />
            <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-slate-300" />

            <svg
              className="w-9 h-9 xs:w-10 xs:h-10 sm:w-13 sm:h-13 md:w-14 md:h-14 drop-shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 24C12 17.3726 17.3726 12 24 12V36C17.3726 36 12 30.6274 12 24Z"
                fill="#159A8C"
              />

              <path
                d="M24 12C30.6274 12 36 17.3726 36 24C36 30.6274 30.6274 36 24 36V12Z"
                stroke="#0F172A"
                strokeWidth="3"
              />

              <path
                d="M21 24H27M24 21V27"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </motion.div>

        {/* Text Ribbon */}
        <div className="relative flex items-center justify-center whitespace-nowrap overflow-visible max-w-full px-2">
          {brandName.split("").map((letter, index) => {
            const offsetFromCenter = index - centerIndex;
            const initialX = offsetFromCenter * offsetMultiplier;

            return (
              <div
                key={index}
                className="relative inline-block overflow-visible"
              >
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: [0, 0.35, 0],
                    height: ["0px", "180px", "0px"],
                  }}
                  transition={{
                    duration: 1.8,
                    delay: 0.4 + index * 0.09,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] bg-gradient-to-b from-transparent via-teal-600/35 to-transparent pointer-events-none blur-[1px]"
                />

                <motion.span
                  initial={{
                    x: initialX,
                    scale: 2.4,
                    opacity: 0,
                    filter: "blur(22px)",
                  }}
                  animate={{
                    x: 0,
                    scale: [2.4, 1, 1.03, 1],
                    opacity: 1,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    duration: 2.8,
                    delay: 0.4 + index * 0.09,
                    ease: [0.12, 0.8, 0.2, 1],
                  }}
                  className="relative inline-block text-[clamp(2.5rem,8vw,8.5rem)] font-black tracking-tight sm:tracking-tighter leading-none select-none"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 text-slate-300/40 blur-[8px] sm:blur-[12px] select-none pointer-events-none"
                  >
                    {letter}
                  </span>

                  {/* Light Green PHARMIX Typography */}
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-[#0F766E] via-[#159A8C] to-[#5DBFB2] drop-shadow-[0_2px_6px_rgba(13,148,136,0.12)]">
                    {letter}
                  </span>
                </motion.span>
              </div>
            );
          })}
        </div>

        {/* Subtitle Ribbon */}
        <motion.div
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 0.95,
            y: 0,
          }}
          transition={{
            delay: 2.9,
            duration: 1.2,
            ease: "easeOut",
          }}
          className="flex flex-col items-center gap-2 sm:gap-2.5 mt-5 xs:mt-6 sm:mt-8 max-w-full px-2"
        >
          <div className="w-32 xs:w-44 sm:w-60 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent relative flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          </div>

          <p className="text-[10px] xs:text-xs sm:text-sm font-semibold text-slate-700 tracking-[0.22em] xs:tracking-[0.32em] sm:tracking-[0.45em] uppercase flex items-center justify-center gap-2 text-center">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
            </span>

            <span>Intelligence & Demand Analytics</span>
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{
              delay: 3.8,
              duration: 1.0,
            }}
            className="text-[9px] sm:text-[10px] font-mono tracking-wider sm:tracking-widest text-slate-500 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center"
          >
            <span>EPIDEMIOLOGY ENGINE</span>
            <span>•</span>
            <span>GLOBAL SUPPLY PREDICTION</span>
            <span className="hidden xs:inline">•</span>
            <span className="hidden xs:inline">VERIFIED V3.8</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom Timeline Progress Bar (7.0s Duration) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="w-full h-1 bg-slate-200/80 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-600 via-teal-500 to-slate-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 bg-white/60 backdrop-blur-sm border-t border-slate-200/50">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse shrink-0" />

            <span className="truncate max-w-[170px] xs:max-w-none">
              ESTABLISHING CLINICAL PIPELINE
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 font-medium shrink-0">
            <span className="hidden xs:inline">
              TRANSITIONING TO /login
            </span>
          </div>
        </div>
      </div>

      {/* Soft Fade Out to /login */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0, 0, 1],
        }}
        transition={{
          duration: 7.0,
          times: [0, 0.86, 0.93, 1],
        }}
        className="absolute inset-0 bg-[#F8FAFC] pointer-events-none z-40"
      />
    </div>
  );
}