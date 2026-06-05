/** Ending özel placeholder — portrait 9:16 */

type EndingSceneArtProps = {
  sceneKey: string;
};

export function EndingSceneArt({ sceneKey }: EndingSceneArtProps) {
  return (
    <div
      className={`ending-scene-art ending-scene-${sceneKey} pointer-events-none absolute inset-0`}
      aria-hidden
    >
      <div className="card-scene-sky absolute inset-0" />
      <div className="card-scene-mist absolute inset-0" />
      <svg
        className="card-scene-svg absolute inset-0 h-full w-full"
        viewBox="0 0 360 640"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <EndingPaths sceneKey={sceneKey} />
      </svg>
    </div>
  );
}

function EndingPaths({ sceneKey }: { sceneKey: string }) {
  switch (sceneKey) {
    case "ending-vizier":
    case "ending-regent":
      return (
        <>
          <rect width="360" height="640" fill="rgba(12,8,18,0.4)" />
          <path
            d="M80 520 L180 280 L280 520 Z"
            fill="rgba(50,25,70,0.85)"
            stroke="rgba(180,140,60,0.35)"
            strokeWidth="2"
          />
          <rect x="155" y="240" width="50" height="90" rx="4" fill="rgba(200,160,70,0.4)" />
          <ellipse cx="180" cy="230" rx="70" ry="18" fill="rgba(220,180,90,0.2)" />
          <path d="M40 120 L320 120" stroke="rgba(140,30,30,0.5)" strokeWidth="8" />
        </>
      );
    case "ending-execution":
      return (
        <>
          <rect width="360" height="640" fill="rgba(20,8,12,0.35)" />
          <ellipse cx="180" cy="480" rx="140" ry="40" fill="rgba(40,15,20,0.7)" />
          <rect x="165" y="200" width="30" height="280" fill="rgba(60,40,35,0.9)" />
          <path d="M120 200 L240 200" stroke="rgba(90,60,50,0.8)" strokeWidth="6" />
          <circle cx="180" cy="180" r="24" fill="rgba(180,30,30,0.25)" />
        </>
      );
    case "ending-debt":
    case "ending-starved":
      return (
        <>
          <rect width="360" height="640" fill="rgba(15,18,28,0.45)" />
          <path
            d="M0 420 Q90 380 180 400 T360 390 L360 640 L0 640Z"
            fill="rgba(25,30,45,0.9)"
          />
          <path
            d="M40 400 L60 280 L80 400 M140 400 L155 260 L170 400 M250 400 L268 300 L286 400"
            stroke="rgba(50,55,70,0.8)"
            strokeWidth="3"
          />
          <ellipse cx="180" cy="120" rx="120" ry="50" fill="rgba(80,90,110,0.15)" />
        </>
      );
    case "ending-walls":
      return (
        <>
          <rect width="360" height="640" fill="rgba(18,22,32,0.4)" />
          <path
            d="M0 380 L40 320 L80 360 L120 300 L160 340 L200 290 L240 330 L280 280 L320 310 L360 270 L360 640 L0 640Z"
            fill="rgba(35,45,60,0.9)"
          />
          <path d="M0 300 L360 260" stroke="rgba(120,130,150,0.25)" strokeWidth="2" />
          <rect x="150" y="200" width="60" height="80" fill="rgba(70,80,95,0.5)" />
        </>
      );
    case "ending-monastery":
      return (
        <>
          <rect width="360" height="640" fill="rgba(12,16,24,0.4)" />
          <path
            d="M60 520 L120 200 L180 520 M180 520 L240 160 L300 520"
            fill="rgba(30,38,55,0.85)"
            stroke="rgba(100,120,150,0.3)"
            strokeWidth="2"
          />
          <ellipse cx="180" cy="140" rx="100" ry="60" fill="rgba(60,70,90,0.2)" />
        </>
      );
    case "ending-betrayal":
      return (
        <>
          <rect width="360" height="640" fill="rgba(18,10,20,0.45)" />
          <ellipse cx="180" cy="400" rx="100" ry="30" fill="rgba(40,20,45,0.7)" />
          <circle cx="120" cy="360" r="28" fill="rgba(60,35,70,0.6)" />
          <circle cx="240" cy="360" r="28" fill="rgba(60,35,70,0.6)" />
          <circle cx="180" cy="340" r="32" fill="rgba(70,40,80,0.65)" />
        </>
      );
    default:
      return (
        <>
          <rect width="360" height="640" fill="rgba(14,12,18,0.5)" />
          <path
            d="M0 450 Q180 380 360 450 L360 640 L0 640Z"
            fill="rgba(35,32,45,0.85)"
          />
          <circle cx="180" cy="280" r="50" fill="rgba(180,140,60,0.12)" />
        </>
      );
  }
}
