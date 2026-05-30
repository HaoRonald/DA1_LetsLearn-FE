"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

interface CourseStats {
  courseCount: number;
  learnerCount: number;
  instructorCount: number;
}

// Animate number counting up
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(timer);
      } else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  if (target === 0)
    return (
      <span className="inline-block w-10 h-5 bg-zinc-200 rounded animate-pulse" />
    );
  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// Floating particles around the AI teacher
function Particle({
  x,
  y,
  delay,
  size,
  color,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
  color: string;
}) {
  return (
    <div
      className="absolute rounded-full opacity-70"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: color,
        animation: `particleFloat ${3 + delay}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

// Typing text animation
function TypingText({ texts }: { texts: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = texts[index];
    if (typing) {
      if (charIdx < current.length) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx(charIdx + 1);
        }, 45);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2000);
        return () => clearTimeout(t);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx(charIdx - 1);
        }, 20);
        return () => clearTimeout(t);
      } else {
        setIndex((i) => (i + 1) % texts.length);
        setTyping(true);
      }
    }
  }, [charIdx, typing, index, texts]);

  return (
    <span>
      {displayed}
      <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle" />
    </span>
  );
}

// The animated AI Robot/Teacher SVG
function AITeacherSVG({ blinking }: { blinking: boolean }) {
  return (
    <svg
      viewBox="0 0 200 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ filter: "drop-shadow(0 20px 40px rgba(59,130,246,0.35))" }}
    >
      {/* Glow behind head */}
      <ellipse cx="100" cy="95" rx="62" ry="62" fill="url(#headGlow)" />

      {/* Neck */}
      <rect x="87" y="148" width="26" height="18" rx="6" fill="#1E3A5F" />

      {/* Body / torso */}
      <rect
        x="54"
        y="162"
        width="92"
        height="72"
        rx="18"
        fill="url(#bodyGrad)"
      />

      {/* Body details – chest panel */}
      <rect
        x="72"
        y="176"
        width="56"
        height="38"
        rx="10"
        fill="#0F2340"
        opacity="0.6"
      />
      {/* Circuit lines on chest */}
      <line
        x1="84"
        y1="187"
        x2="116"
        y2="187"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <line
        x1="84"
        y1="194"
        x2="108"
        y2="194"
        stroke="#60A5FA"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="84"
        y1="200"
        x2="112"
        y2="200"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="120" cy="194" r="3" fill="#F97316" />
      <circle cx="116" cy="187" r="2" fill="#34D399" />
      <circle cx="112" cy="200" r="2" fill="#60A5FA" />

      {/* Left arm */}
      <rect
        x="22"
        y="162"
        width="32"
        height="14"
        rx="7"
        fill="url(#armGrad)"
        style={{
          transformOrigin: "54px 169px",
          animation: "armWaveLeft 2.5s ease-in-out infinite",
        }}
      />
      <circle cx="24" cy="169" r="7" fill="#1E3A5F" />

      {/* Right arm (waving / pointing) */}
      <g
        style={{
          transformOrigin: "146px 169px",
          animation: "armWaveRight 2s ease-in-out infinite",
        }}
      >
        <rect
          x="146"
          y="162"
          width="32"
          height="14"
          rx="7"
          fill="url(#armGrad)"
        />
        <circle cx="176" cy="169" r="7" fill="#1E3A5F" />
        {/* Pointer finger */}
        <line
          x1="176"
          y1="162"
          x2="184"
          y2="148"
          stroke="#F97316"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="185" cy="146" r="4" fill="#F97316" />
      </g>

      {/* Head */}
      <rect
        x="44"
        y="42"
        width="112"
        height="108"
        rx="28"
        fill="url(#headGrad)"
      />

      {/* Antenna */}
      <line
        x1="100"
        y1="42"
        x2="100"
        y2="18"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="100"
        cy="14"
        r="7"
        fill="#3B82F6"
        style={{ animation: "antennaPulse 1.5s ease-in-out infinite" }}
      />
      <circle
        cx="100"
        cy="14"
        r="12"
        fill="#3B82F6"
        opacity="0.2"
        style={{ animation: "antennaPulse 1.5s ease-in-out infinite" }}
      />

      {/* Ear bolts */}
      <circle cx="44" cy="96" r="8" fill="#1D3A6E" />
      <circle cx="44" cy="96" r="4" fill="#3B82F6" />
      <circle cx="156" cy="96" r="8" fill="#1D3A6E" />
      <circle cx="156" cy="96" r="4" fill="#3B82F6" />

      {/* Eyes */}
      {blinking ? (
        <>
          <rect x="64" y="83" width="28" height="4" rx="2" fill="#3B82F6" />
          <rect x="108" y="83" width="28" height="4" rx="2" fill="#3B82F6" />
        </>
      ) : (
        <>
          {/* Left eye */}
          <rect x="62" y="76" width="32" height="24" rx="10" fill="#0F2340" />
          <circle
            cx="78"
            cy="88"
            r="8"
            fill="#3B82F6"
            style={{ animation: "eyeGlow 3s ease-in-out infinite" }}
          />
          <circle cx="78" cy="88" r="4" fill="#DBEAFE" />
          <circle cx="80" cy="85" r="1.5" fill="white" />
          {/* Right eye */}
          <rect x="106" y="76" width="32" height="24" rx="10" fill="#0F2340" />
          <circle
            cx="122"
            cy="88"
            r="8"
            fill="#3B82F6"
            style={{ animation: "eyeGlow 3s ease-in-out infinite 0.3s" }}
          />
          <circle cx="122" cy="88" r="4" fill="#DBEAFE" />
          <circle cx="124" cy="85" r="1.5" fill="white" />
        </>
      )}

      {/* Mouth / speaker */}
      <rect x="76" y="118" width="48" height="14" rx="7" fill="#0F2340" />
      <rect
        x="80"
        y="122"
        width="8"
        height="6"
        rx="2"
        fill="#34D399"
        style={{ animation: "speakerBar 0.6s ease-in-out infinite" }}
      />
      <rect
        x="91"
        y="120"
        width="8"
        height="10"
        rx="2"
        fill="#3B82F6"
        style={{ animation: "speakerBar 0.6s ease-in-out 0.15s infinite" }}
      />
      <rect
        x="102"
        y="122"
        width="8"
        height="6"
        rx="2"
        fill="#34D399"
        style={{ animation: "speakerBar 0.6s ease-in-out 0.3s infinite" }}
      />
      <rect
        x="113"
        y="121"
        width="7"
        height="8"
        rx="2"
        fill="#60A5FA"
        style={{ animation: "speakerBar 0.6s ease-in-out 0.1s infinite" }}
      />

      {/* Feet */}
      <rect x="68" y="226" width="28" height="16" rx="8" fill="#1E3A5F" />
      <rect x="104" y="226" width="28" height="16" rx="8" fill="#1E3A5F" />

      {/* Gradients */}
      <defs>
        <radialGradient id="headGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="headGrad"
          x1="44"
          y1="42"
          x2="156"
          y2="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#0F2340" />
        </linearGradient>
        <linearGradient
          id="bodyGrad"
          x1="54"
          y1="162"
          x2="146"
          y2="234"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1E3A5F" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient
          id="armGrad"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <stop stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#1E3A5F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Floating knowledge bubbles
function KnowledgeBubble({
  text,
  x,
  y,
  delay,
}: {
  text: string;
  x: number;
  y: number;
  delay: number;
}) {
  return (
    <div
      className="absolute px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-full text-[11px] font-bold text-blue-700 shadow-lg whitespace-nowrap"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `bubbleFloat ${4 + delay * 0.5}s ease-in-out ${delay}s infinite`,
      }}
    >
      {text}
    </div>
  );
}

export function AITeacherAnimation() {
  const [blinking, setBlinking] = useState(false);
  const [stats, setStats] = useState<CourseStats>({
    courseCount: 0,
    learnerCount: 0,
    instructorCount: 0,
  });

  // Fetch real stats from public /Course endpoint
  useEffect(() => {
    axiosInstance
      .get("/Course")
      .then((res) => {
        const courses: any[] = res.data;
        const courseCount = courses.length;
        const learnerCount = courses.reduce(
          (sum: number, c: any) => sum + (c.totalJoined || 0),
          0,
        );
        const instructorCount = new Set(
          courses.map((c: any) => c.creatorId).filter(Boolean),
        ).size;
        setStats({ courseCount, learnerCount, instructorCount });
      })
      .catch(() => {
        // fallback nếu API lỗi
        setStats({ courseCount: 0, learnerCount: 0, instructorCount: 0 });
      });
  }, []);

  // Random blink
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
      setTimeout(blink, 2000 + Math.random() * 3000);
    };
    const t = setTimeout(blink, 1500);
    return () => clearTimeout(t);
  }, []);

  const TYPING_TEXTS = [
    "Welcome to LetsLearn!",
    "Learn smarter with AI 🤖",
    "I will help you learn more efficiently!",
    "Thousands of courses are waiting for you ✨",
    "Connect · Collaborate · Create 🚀",
  ];

  const PARTICLES = [
    { x: 8, y: 15, delay: 0, size: 6, color: "#3B82F6" },
    { x: 85, y: 10, delay: 1.2, size: 8, color: "#F97316" },
    { x: 92, y: 72, delay: 0.7, size: 5, color: "#34D399" },
    { x: 5, y: 80, delay: 2, size: 7, color: "#A78BFA" },
    { x: 50, y: 5, delay: 0.4, size: 5, color: "#60A5FA" },
    { x: 78, y: 45, delay: 1.8, size: 6, color: "#F472B6" },
    { x: 18, y: 55, delay: 1.0, size: 4, color: "#34D399" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <style>{`
        @keyframes teacherBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes armWaveRight {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(-18deg); }
          60% { transform: rotate(8deg); }
        }
        @keyframes armWaveLeft {
          0%, 100% { transform: rotate(0deg); }
          40% { transform: rotate(10deg); }
          70% { transform: rotate(-5deg); }
        }
        @keyframes antennaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes eyeGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.6) drop-shadow(0 0 6px #3B82F6); }
        }
        @keyframes speakerBar {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1.4); }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.9; }
          50% { transform: translateY(-14px) scale(1.04); opacity: 1; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(12px, -16px) scale(1.3); opacity: 1; }
          66% { transform: translate(-8px, -8px) scale(0.8); opacity: 0.4; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes scanLine {
          0% { transform: translateY(0%); opacity: 0.6; }
          100% { transform: translateY(500%); opacity: 0; }
        }
      `}</style>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </div>

      {/* Glowing ring behind robot */}
      <div className="relative mb-4">
        <div
          className="absolute inset-0 m-auto w-56 h-56 rounded-full border-2 border-blue-400/30"
          style={{ animation: "ringPulse 3s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-0 m-auto w-64 h-64 rounded-full border border-blue-300/20"
          style={{ animation: "ringPulse 3s ease-in-out 1s infinite" }}
        />

        {/* Robot */}
        <div
          className="relative w-48 h-64 mx-auto"
          style={{ animation: "teacherBob 3s ease-in-out infinite" }}
        >
          <AITeacherSVG blinking={blinking} />
        </div>
      </div>

      {/* Knowledge bubbles — course count từ DB */}
      <div className="relative w-72 h-16">
        <KnowledgeBubble text="⚡ AI-Powered" x={0} y={10} delay={0} />
        <KnowledgeBubble
          text={`📚 ${stats.courseCount > 0 ? stats.courseCount : "..."}  Courses`}
          x={55}
          y={0}
          delay={1.5}
        />
        <KnowledgeBubble text="🎯 Smart Quizzes" x={18} y={60} delay={0.8} />
      </div>

      {/* Typing speech bubble */}
      <div className="mt-4 px-5 py-3 bg-white/90 backdrop-blur-md border border-blue-100 rounded-2xl shadow-lg max-w-xs text-center">
        <p className="text-sm font-bold text-zinc-800 min-h-[20px]">
          <TypingText texts={TYPING_TEXTS} />
        </p>
      </div>

      {/* Stats row — real data từ DB */}
      <div className="mt-5 flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-zinc-900">
            <CountUp target={stats.learnerCount} />
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Learners
          </span>
        </div>
        <div className="w-px h-8 bg-zinc-200" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-zinc-900">
            <CountUp target={stats.courseCount} />
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Courses
          </span>
        </div>
        <div className="w-px h-8 bg-zinc-200" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-zinc-900">
            <CountUp target={stats.instructorCount} />
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Instructors
          </span>
        </div>
      </div>
    </div>
  );
}
