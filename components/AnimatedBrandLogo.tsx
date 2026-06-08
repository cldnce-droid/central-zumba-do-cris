"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { links } from "@/lib/data";

const INTRO_STORAGE_KEY = "zumba-do-cris-logo-intro-seen";

const particles = [
  { color: "#f20772", left: "12%", top: "25%", size: 6, delay: 0 },
  { color: "#ffc400", left: "25%", top: "12%", size: 7, delay: 1.2 },
  { color: "#129ee8", left: "82%", top: "22%", size: 6, delay: 2.4 },
  { color: "#6d2bbf", left: "91%", top: "48%", size: 5, delay: 0.8 },
  { color: "#f20772", left: "16%", top: "76%", size: 5, delay: 3.1 },
  { color: "#ffc400", left: "76%", top: "86%", size: 7, delay: 1.8 },
  { color: "#129ee8", left: "7%", top: "51%", size: 5, delay: 4 },
  { color: "#6d2bbf", left: "88%", top: "72%", size: 6, delay: 2.9 }
] as const;

export function AnimatedBrandLogo() {
  const reduceMotion = useReducedMotion();
  const [introReady, setIntroReady] = useState(false);
  const [playIntro, setPlayIntro] = useState(false);

  useEffect(() => {
    // The entrance runs only once per browser profile.
    const hasSeenIntro = localStorage.getItem(INTRO_STORAGE_KEY) === "true";

    setPlayIntro(!hasSeenIntro);
    setIntroReady(true);

    if (!hasSeenIntro) {
      localStorage.setItem(INTRO_STORAGE_KEY, "true");
    }
  }, []);

  return (
    <div className="brand-animation-stage">
      <motion.div
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: 1,
                scale: 1,
                y: [0, -3, 0, 2, 0],
                rotate: [0, 0.15, 0, -0.12, 0]
              }
        }
        className="brand-logo-float"
        initial={
          introReady && playIntro && !reduceMotion
            ? { opacity: 0, scale: 0.88, y: 18 }
            : false
        }
        key={introReady ? "ready" : "loading"}
        transition={
          introReady && playIntro
            ? {
                opacity: { duration: 0.7 },
                scale: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                y: {
                  duration: 8,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 0.8
                },
                rotate: {
                  duration: 11,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 0.8
                }
              }
            : {
                y: { duration: 8, ease: "easeInOut", repeat: Infinity },
                rotate: { duration: 11, ease: "easeInOut", repeat: Infinity }
              }
        }
      >
        <Image
          alt="Logo oficial Zumba do Cris"
          className="brand-logo-image"
          height={1024}
          priority
          src={links.officialLogo}
          width={1536}
        />
      </motion.div>

      {!reduceMotion ? (
        <>
          <div aria-hidden="true" className="brand-particles">
            {particles.map((particle, index) => (
              <span
                className="brand-particle"
                key={`${particle.left}-${particle.top}`}
                style={{
                  animationDelay: `${particle.delay}s`,
                  backgroundColor: particle.color,
                  color: particle.color,
                  height: particle.size,
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  "--particle-drift": `${index % 2 === 0 ? 8 : -8}px`
                } as CSSProperties}
              />
            ))}
          </div>

          <svg
            aria-hidden="true"
            className="brand-svg-effects"
            viewBox="0 0 100 100"
          >
            <defs>
              <filter id="soft-paint-blur">
                <feGaussianBlur stdDeviation="1.4" />
              </filter>
            </defs>

            <motion.g
              animate={{ opacity: [0.03, 0.12, 0.03], scale: [0.98, 1.03, 0.98] }}
              filter="url(#soft-paint-blur)"
              style={{ transformOrigin: "50% 50%" }}
              transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
            >
              <path d="M7 35c8-6 13-8 21-8-5 4-10 8-18 12Z" fill="#f20772" />
              <path d="M74 20c9 2 14 5 20 11-8-2-14-3-22-2Z" fill="#129ee8" />
              <path d="M70 82c8-2 15-1 22 2-8 1-13 3-20 7Z" fill="#ffc400" />
            </motion.g>

            <motion.circle
              animate={{ opacity: [0, 0, 0.5, 0], r: [3, 3, 6, 8] }}
              cx="78"
              cy="66"
              fill="none"
              stroke="#129ee8"
              strokeWidth="0.8"
              transition={{
                duration: 4,
                ease: "easeOut",
                repeat: Infinity,
                times: [0, 0.68, 0.78, 1]
              }}
            />
          </svg>

          <div aria-hidden="true" className="brand-shine" />
        </>
      ) : null}
    </div>
  );
}
