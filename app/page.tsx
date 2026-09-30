"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PharmixNetflixIntro() {
  const router = useRouter();
  const brandName = "PHARMIX";

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 7800);
    return () => clearTimeout(timer);
  }, [router]);

  const totalLetters = brandName.length;
  const centerIndex = (totalLetters - 1) / 2;

  return (
    <div className="fixed inset-0 z-50 bg-[#060D0D] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      
      {/* Edge-Only Vignette Mask */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #00C9A7 1.5px, transparent 0)`,
          backgroundSize: '36px 36px',
          WebkitMaskImage: 'radial-gradient(circle at center, transparent 35%, black 90%)',
          maskImage: 'radial-gradient(circle at center, transparent 35%, black 90%)'
        }}
      />

      {/* Ambient Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.4, 0.2], scale: [0.4, 1.3, 1.7] }}
        transition={{ duration: 7.2, ease: "easeOut" }}
        className="absolute w-[750px] h-[750px] bg-[#00C9A7]/20 rounded-full blur-[170px] pointer-events-none"
      />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ 
          scale: [0.7, 1, 1.05, 1, 1.02],
          opacity: [0, 1, 1, 1, 1] 
        }}
        transition={{ 
          duration: 7.5, 
          times: [0, 0.35, 0.6, 0.85, 1],
          ease: "easeInOut" 
        }}
        className="flex flex-col items-center justify-center z-10"
      >
        {/* LOGO MARK 1: Minimalist Cross + Analytics Line */}
     {/* LOGO MARK 2: Precision Geometric Capsule Cross */}
<motion.div
  initial={{ opacity: 0, y: -25, scale: 0.8 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 1.4, delay: 0.2, ease: [0.12, 0.8, 0.2, 1] }}
  className="mb-8 relative"
>
  <div className="w-20 h-20 sm:w-22 sm:h-22 bg-[#081514] border border-[#00C9A7]/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,201,167,0.2)]">
    <svg
      className="w-11 h-11"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Capsule Half */}
      <path
        d="M12 24C12 17.3726 17.3726 12 24 12V36C17.3726 36 12 30.6274 12 24Z"
        fill="#00C9A7"
      />
      {/* Right Capsule Half (Outlined) */}
      <path
        d="M24 12C30.6274 12 36 17.3726 36 24C36 30.6274 30.6274 36 24 36V12Z"
        stroke="#E6FFFA"
        strokeWidth="3"
      />
      {/* Center Medical Cross Notch */}
      <path
        d="M21 24H27M24 21V27"
        stroke="#060D0D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
</motion.div>

        {/* Text Ribbon */}
        <div className="flex items-center justify-center overflow-visible">
          {brandName.split("").map((letter, index) => {
            const offsetFromCenter = index - centerIndex;
            const initialX = offsetFromCenter * 120;

            return (
              <motion.span
                key={index}
                initial={{
                  x: initialX,
                  scale: 2.8,
                  opacity: 0,
                  filter: "blur(28px)",
                }}
                animate={{
                  x: 0,
                  scale: [2.8, 1, 1.04, 1],
                  opacity: 1,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 2.8,
                  delay: 0.3 + index * 0.08,
                  ease: [0.12, 0.8, 0.2, 1],
                }}
                className="inline-block text-6xl sm:text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E6FFFA] to-[#80E8D1] drop-shadow-[0_0_35px_rgba(0,201,167,0.5)] tracking-tight"
              >
                {letter}
              </motion.span>
            );
          })}
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 0.95, y: 0 }}
          transition={{ delay: 2.8, duration: 1.2, ease: "easeOut" }}
          className="text-xs sm:text-sm font-bold text-[#A7F3D0] tracking-[0.45em] uppercase mt-6 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-ping" />
          Intelligence & Demand Analytics
        </motion.p>
      </motion.div>

      {/* Dark Fade Out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 7.8, times: [0, 0.88, 1] }}
        className="absolute inset-0 bg-black pointer-events-none z-20"
      />
    </div>
  );
}