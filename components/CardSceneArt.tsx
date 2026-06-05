/** Act / köken için CSS + SVG sahne silüeti */

type CardSceneArtProps = {
  act: number;
  sceneKey?: string;
};

export function CardSceneArt({ act, sceneKey }: CardSceneArtProps) {
  const variant = sceneKey ?? `act-${act}`;

  return (
    <div
      className={`card-scene-art card-scene-${variant} pointer-events-none absolute inset-0`}
      aria-hidden
    >
      <div className="card-scene-sky absolute inset-0" />
      <div className="card-scene-mid absolute inset-x-0 bottom-[18%] h-[55%]" />
      <div className="card-scene-front absolute inset-x-0 bottom-0 h-[42%]" />
      <svg
        className="card-scene-svg absolute inset-0 h-full w-full"
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ScenePaths act={act} sceneKey={sceneKey} />
      </svg>
      <div className="card-scene-mist absolute inset-0" />
    </div>
  );
}

function ScenePaths({ act, sceneKey }: { act: number; sceneKey?: string }) {
  const id = sceneKey ?? `a${act}`;

  if (id === "dock-worker" || act === 2) {
    return (
      <>
        <path
          d="M0 200 L80 160 L120 175 L200 140 L280 165 L400 130 L400 240 L0 240Z"
          fill="rgba(15,35,50,0.85)"
        />
        <path d="M60 175 L60 95 L65 200Z" fill="rgba(25,45,60,0.9)" />
        <path d="M180 155 L185 70 L192 158Z" fill="rgba(30,50,65,0.9)" />
        <path d="M300 140 L305 60 L312 145Z" fill="rgba(28,48,62,0.9)" />
        <path
          d="M220 150 Q280 120 340 155 L320 200 L180 200Z"
          fill="rgba(8,20,30,0.7)"
        />
      </>
    );
  }

  if (id === "temple-acolyte") {
    return (
      <>
        <path
          d="M120 200 L200 80 L280 200Z"
          fill="rgba(40,30,55,0.75)"
          stroke="rgba(120,90,160,0.3)"
          strokeWidth="2"
        />
        <ellipse cx="200" cy="75" rx="24" ry="8" fill="rgba(180,140,60,0.25)" />
        <rect x="192" y="60" width="16" height="30" rx="2" fill="rgba(200,160,80,0.35)" />
      </>
    );
  }

  if (id === "arena-fighter") {
    return (
      <>
        <ellipse cx="200" cy="195" rx="160" ry="25" fill="rgba(50,35,25,0.6)" />
        <path
          d="M40 200 Q200 120 360 200"
          fill="none"
          stroke="rgba(90,60,40,0.4)"
          strokeWidth="3"
        />
        <path d="M30 200 L370 200" stroke="rgba(60,40,30,0.5)" strokeWidth="4" />
      </>
    );
  }

  if (id === "thief") {
    return (
      <>
        <path
          d="M0 190 L50 150 L90 170 L150 130 L220 160 L280 140 L350 165 L400 150 L400 240 L0 240Z"
          fill="rgba(25,20,30,0.8)"
        />
        <rect x="160" y="120" width="80" height="70" rx="4" fill="rgba(15,12,20,0.9)" />
        <path d="M200 100 L200 195" stroke="rgba(80,60,100,0.35)" strokeWidth="2" />
      </>
    );
  }

  switch (act) {
    case 5:
      return (
        <>
          <path
            d="M140 200 L200 60 L260 200Z"
            fill="rgba(60,15,15,0.8)"
            stroke="rgba(140,40,40,0.4)"
            strokeWidth="2"
          />
          <path
            d="M80 80 Q200 40 320 80"
            fill="none"
            stroke="rgba(80,30,30,0.35)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <rect x="170" y="175" width="60" height="25" rx="2" fill="rgba(40,10,10,0.9)" />
        </>
      );
    case 4:
      return (
        <>
          <path
            d="M60 200 Q120 120 180 200Z"
            fill="rgba(35,20,50,0.75)"
            stroke="rgba(90,50,120,0.3)"
            strokeWidth="2"
          />
          <path
            d="M220 200 Q280 100 340 200Z"
            fill="rgba(35,20,50,0.75)"
            stroke="rgba(90,50,120,0.3)"
            strokeWidth="2"
          />
          <rect x="0" y="160" width="400" height="80" fill="rgba(20,10,30,0.5)" />
        </>
      );
    case 3:
      return (
        <>
          <path
            d="M0 170 L40 120 L80 140 L120 90 L160 130 L200 80 L240 120 L280 95 L320 130 L360 100 L400 140 L400 240 L0 240Z"
            fill="rgba(45,35,20,0.8)"
          />
          <rect x="170" y="70" width="24" height="100" fill="rgba(30,25,15,0.85)" />
          <rect x="210" y="50" width="20" height="120" fill="rgba(35,28,18,0.85)" />
          <rect x="250" y="85" width="18" height="85" fill="rgba(32,26,16,0.85)" />
        </>
      );
    default:
      return (
        <>
          <path
            d="M0 185 L60 150 L100 165 L140 130 L200 155 L260 125 L320 150 L400 135 L400 240 L0 240Z"
            fill="rgba(22,20,18,0.85)"
          />
          <rect x="30" y="140" width="35" height="55" fill="rgba(12,11,10,0.9)" />
          <rect x="85" y="155" width="28" height="40" fill="rgba(14,12,11,0.9)" />
          <rect x="300" y="145" width="40" height="50" fill="rgba(12,11,10,0.9)" />
          <path
            d="M0 200 L400 200"
            stroke="rgba(50,45,40,0.4)"
            strokeWidth="3"
          />
        </>
      );
  }
}
