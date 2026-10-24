import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import carAnim from '../assets/car.json'

/** Animación de entrada: Corsa verde rodando (Lottie). */
export function CarLottie({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: !reduce,
      autoplay: !reduce,
      animationData: carAnim,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    })
    if (reduce) anim.goToAndStop(20, true)
    return () => anim.destroy()
  }, [])
  return <div ref={ref} className={className} aria-hidden="true" />
}

export function Splash({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center px-6">
      <div className="fade grid w-full max-w-[360px] justify-items-center gap-4 text-center">
        <div className="neu w-full overflow-hidden p-2" style={{ borderRadius: 32 }}>
          <CarLottie className="w-full" />
        </div>
        <p className="title-wide text-[12px] text-[var(--muted)]">Mi Corsa</p>
        <p className="text-[13px] text-[var(--muted)]">{label}</p>
      </div>
    </div>
  )
}
