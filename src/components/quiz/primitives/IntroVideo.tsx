"use client";

import { useEffect, useRef } from "react";

export function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.loop = true;
    const play = () => {
      el.play().catch(() => {});
    };
    play();
    el.addEventListener("ended", play);
    return () => el.removeEventListener("ended", play);
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="h-[180px] w-full object-cover sm:h-[220px] md:h-[300px]"
    >
      <source src="/video/thymos-intro.webm" type="video/webm" />
      <source src="/video/thymos-intro.mp4" type="video/mp4" />
    </video>
  );
}
