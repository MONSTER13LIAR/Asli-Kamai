// Loading state with a mascot: the rider for reading and thinking, the
// riding pose for writing the lesson, the scooter for building the quiz.
const ART = {
  boy: { src: '/mascot-boy.webp', w: 114, h: 320 },
  riding: { src: '/mascot-riding.webp', w: 452, h: 492 },
  scooter: { src: '/mascot-scooter.webp', w: 264, h: 200 },
}

export default function Loader({ kind, label }: { kind: keyof typeof ART; label: string }) {
  const a = ART[kind]
  return (
    <div className={'loader loader-' + kind} role="status" aria-live="polite">
      <div className="loader-art">
        <img src={a.src} width={a.w} height={a.h} alt="" />
        {kind === 'scooter' && <span className="loader-road" />}
      </div>
      <span className="loader-label">{label}</span>
    </div>
  )
}
