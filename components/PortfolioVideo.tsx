"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

type Props = { title: string; src: string; poster: string; duration: string };

export function PortfolioVideo({ title, src, poster, duration }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const titleId = useId();

  useEffect(() => () => {
    videoRef.current?.pause();
    restoreRef.current?.();
  }, []);

  function close() {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    video?.pause();
    video?.removeAttribute("src");
    video?.load();
    if (document.fullscreenElement && dialog?.contains(document.fullscreenElement)) {
      void document.exitFullscreen().catch(() => undefined);
    }
    dialog?.close();
    restoreRef.current?.();
    restoreRef.current = null;
    triggerRef.current?.focus({ preventScroll: true });
  }

  function open() {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    if (!dialog || !video || dialog.open) return;
    setFailed(false);
    const scrollY = window.scrollY;
    const previousStyle = document.body.getAttribute("style");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    restoreRef.current = () => {
      if (previousStyle === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", previousStyle);
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
    dialog.showModal();
    video.src = src;
    // Native fullscreen is optional; the dialog itself fills the viewport.
    if (dialog.requestFullscreen) void dialog.requestFullscreen().catch(() => undefined);
    void video.play().catch(() => undefined);
  }

  return (
    <div className="portfolio-video">
      <button ref={triggerRef} className="portfolio-video-cover" type="button" onClick={open} aria-label={`Assistir: ${title}`}>
        <Image src={poster} alt="" width={1920} height={1080} unoptimized />
        <span className="portfolio-video-play" aria-hidden="true">▶</span>
        <span className="portfolio-video-caption"><strong>{title}</strong><span> · {duration}</span></span>
      </button>
      <dialog ref={dialogRef} className="portfolio-video-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }}>
        <div className="portfolio-video-toolbar"><h2 id={titleId}>{title}</h2><button type="button" onClick={close} autoFocus>Fechar ✕</button></div>
        <video ref={videoRef} controls playsInline preload="none" aria-label={title} onError={() => setFailed(true)} />
        {failed && <p className="portfolio-video-error" role="alert">Não foi possível carregar o vídeo. Feche e tente novamente.</p>}
      </dialog>
    </div>
  );
}
