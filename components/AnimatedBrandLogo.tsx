"use client";

import Image from "next/image";
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
  const [playIntro, setPlayIntro] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem(INTRO_STORAGE_KEY) === "true";
    setPlayIntro(!hasSeenIntro);
    if (!hasSeenIntro) localStorage.setItem(INTRO_STORAGE_KEY, "true");
  }, []);

  return (
    <div className="brand-animation-stage">
      <div className={`brand-logo-float${playIntro ? " brand-logo-intro" : ""}`}>
        <Image
          alt="Logo oficial Zumba do Cris"
          className="brand-logo-image"
          height={1024}
          priority
          src={links.officialLogo}
          width={1536}
        />
      </div>

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

      <svg aria-hidden="true" className="brand-svg-effects" viewBox="0 0 100 100">
        <defs>
          <filter id="soft-paint-blur">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <g className="brand-paint-pulse" filter="url(#soft-paint-blur)">
          <path d="M7 35c8-6 13-8 21-8-5 4-10 8-18 12Z" fill="#f20772" />
          <path d="M74 20c9 2 14 5 20 11-8-2-14-3-22-2Z" fill="#129ee8" />
          <path d="M70 82c8-2 15-1 22 2-8 1-13 3-20 7Z" fill="#ffc400" />
        </g>
        <circle className="brand-heart-pulse" cx="78" cy="66" fill="none" r="4" stroke="#129ee8" strokeWidth="0.8" />
      </svg>

      <div aria-hidden="true" className="brand-shine" />
    </div>
  );
}
