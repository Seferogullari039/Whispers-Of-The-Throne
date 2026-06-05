import { GameScreen } from "@/components/GameScreen";

export default function Home() {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-1 flex-col overflow-hidden">
      <GameScreen />
    </div>
  );
}
