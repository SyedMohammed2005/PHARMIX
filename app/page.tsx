"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const letters = ["P", "H", "A", "R", "M", "I", "X"];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 5200);

    return () => clearTimeout(timer);
  }, [router]);

  function skipIntro() {
    router.replace("/login");
  }

  return (
    <main
      onClick={skipIntro}
      className="relative flex min-h-screen cursor-pointer items-center justify-center overflow-hidden bg-[#030807] text-white"
    >
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0">
        {/* Central ambient light */}
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.055] blur-[140px]" />

        {/* Secondary light */}
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-teal-500/[0.035] blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-emerald-500/[0.035] blur-[130px]" />

        {/* Professional grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.45)_100%)]" />

        {/* Floating particles */}
        <span className="absolute left-[14%] top-[25%] h-1 w-1 rounded-full bg-emerald-400/50 animate-particle-one" />

        <span className="absolute left-[27%] top-[70%] h-1 w-1 rounded-full bg-teal-300/40 animate-particle-two" />

        <span className="absolute right-[17%] top-[30%] h-1 w-1 rounded-full bg-emerald-300/50 animate-particle-three" />

        <span className="absolute right-[25%] bottom-[23%] h-1.5 w-1.5 rounded-full bg-teal-300/35 animate-particle-one" />
      </div>

      {/* =========================================================
          MAIN LOGO
      ========================================================= */}

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[160px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.055] blur-[70px] animate-logo-glow" />

        {/* Wordmark */}
        <div className="relative flex items-center justify-center">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="pharmix-letter"
              style={{
                animationDelay: `${index * 500}ms`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Accent line */}
        <div className="mt-7 h-px w-0 animate-accent-line bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Subtitle */}
        <div className="mt-5 overflow-hidden">
          <p className="animate-subtitle text-center text-[9px] font-medium uppercase tracking-[0.48em] text-slate-400 sm:text-[10px]">
            Intelligent Pharmacy Platform
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-9 h-px w-[170px] overflow-hidden bg-white/[0.08] sm:w-[210px]">
          <div className="h-full origin-left animate-loading bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300" />
        </div>

        <p className="mt-4 animate-status text-[7px] font-medium uppercase tracking-[0.32em] text-slate-600">
          Initializing intelligence
        </p>
      </div>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 animate-footer">
        <div className="flex items-center gap-2.5 text-[7px] font-medium uppercase tracking-[0.28em] text-slate-700">
          <span className="h-1 w-1 rounded-full bg-emerald-500/50" />

          PHARMIX AI

          <span className="h-1 w-1 rounded-full bg-emerald-500/50" />
        </div>
      </div>

      {/* =========================================================
          ANIMATIONS
      ========================================================= */}

      <style jsx>{`
        /* -------------------------------------------------------
           LETTER REVEAL
        ------------------------------------------------------- */

        .pharmix-letter {
          display: inline-block;

          opacity: 0;

          transform:
            translateY(42px)
            scale(0.82);

          background: linear-gradient(
            180deg,
            #ffffff 0%,
            #f0fdf9 38%,
            #a7f3d0 72%,
            #34d399 100%
          );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;

          font-size: clamp(4rem, 12vw, 9.5rem);

          font-weight: 900;

          line-height: 0.9;

          letter-spacing: -0.075em;

          text-shadow:
            0 0 35px rgba(16, 185, 129, 0.08);

          filter: blur(8px);

          animation:
            letterReveal
            500ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        @keyframes letterReveal {
          0% {
            opacity: 0;

            transform:
              translateY(42px)
              scale(0.82);

            filter: blur(8px);
          }

          55% {
            opacity: 1;
            filter: blur(0);
          }

          100% {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);

            filter: blur(0);
          }
        }

        /* -------------------------------------------------------
           LOGO GLOW
        ------------------------------------------------------- */

        @keyframes logoGlow {
          0%,
          100% {
            opacity: 0.25;
            transform: translate(-50%, -50%) scale(0.9);
          }

          50% {
            opacity: 0.55;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        .animate-logo-glow {
          animation: logoGlow 3.5s ease-in-out infinite;
        }

        /* -------------------------------------------------------
           ACCENT LINE
        ------------------------------------------------------- */

        @keyframes accentLine {
          0% {
            width: 0;
            opacity: 0;
          }

          100% {
            width: 145px;
            opacity: 1;
          }
        }

        .animate-accent-line {
          animation:
            accentLine
            900ms
            cubic-bezier(0.16, 1, 0.3, 1)
            3.4s
            forwards;
        }

        /* -------------------------------------------------------
           SUBTITLE
        ------------------------------------------------------- */

        @keyframes subtitleReveal {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-subtitle {
          opacity: 0;

          animation:
            subtitleReveal
            700ms
            ease-out
            3.55s
            forwards;
        }

        /* -------------------------------------------------------
           LOADING
        ------------------------------------------------------- */

        @keyframes loading {
          0% {
            transform: scaleX(0);
          }

          100% {
            transform: scaleX(1);
          }
        }

        .animate-loading {
          transform: scaleX(0);

          animation:
            loading
            2.8s
            cubic-bezier(0.65, 0, 0.35, 1)
            2s
            forwards;
        }

        /* -------------------------------------------------------
           STATUS
        ------------------------------------------------------- */

        @keyframes statusReveal {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }

        .animate-status {
          opacity: 0;

          animation:
            statusReveal
            500ms
            ease-out
            3.2s
            forwards;
        }

        /* -------------------------------------------------------
           FOOTER
        ------------------------------------------------------- */

        @keyframes footerReveal {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }

        .animate-footer {
          opacity: 0;

          animation:
            footerReveal
            600ms
            ease-out
            3.7s
            forwards;
        }

        /* -------------------------------------------------------
           PARTICLES
        ------------------------------------------------------- */

        @keyframes particleOne {
          0%,
          100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }

          50% {
            transform: translate(22px, -28px);
            opacity: 0.7;
          }
        }

        @keyframes particleTwo {
          0%,
          100% {
            transform: translate(0, 0);
            opacity: 0.15;
          }

          50% {
            transform: translate(-18px, 22px);
            opacity: 0.6;
          }
        }

        @keyframes particleThree {
          0%,
          100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }

          50% {
            transform: translate(28px, 16px);
            opacity: 0.65;
          }
        }

        .animate-particle-one {
          animation: particleOne 5s ease-in-out infinite;
        }

        .animate-particle-two {
          animation: particleTwo 6s ease-in-out infinite;
        }

        .animate-particle-three {
          animation: particleThree 7s ease-in-out infinite;
        }

        /* -------------------------------------------------------
           REDUCED MOTION
        ------------------------------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .pharmix-letter,
          .animate-logo-glow,
          .animate-accent-line,
          .animate-subtitle,
          .animate-loading,
          .animate-status,
          .animate-footer,
          .animate-particle-one,
          .animate-particle-two,
          .animate-particle-three {
            animation: none;
            opacity: 1;
            transform: none;
            filter: none;
          }

          .pharmix-letter {
            width: auto;
          }

          .animate-accent-line {
            width: 145px;
          }
        }
      `}</style>
    </main>
  );
}