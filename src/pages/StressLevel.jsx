import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useSerial from "../hooks/useSerial";

const STRESS_LEVELS = [
  { icon: "/images/emote.png", label: "Chill Mode", color: "#4CAF50" },
  { icon: "/images/emote.png", label: "Warm-Up", color: "#FFEB3B" },
  { icon: "/images/emote.png", label: "Focused", color: "#FFC107" },
  { icon: "/images/emote.png", label: "Overdrive", color: "#FF9800" },
  { icon: "/images/emote.png", label: "Meltdown", color: "#F44336" },
];

const SIS_THRESHOLDS = {
  chill: 50,
  warmUp: 150,
  focused: 300,
  overdrive: 500,
};

const StressLevel = () => {
  const location = useLocation();

  const [levelIdx, setLevelIdx] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [stressBallScore, setStressBallScore] = useState(0);

  const [gameStressResult, setGameStressResult] = useState(null); 

  useEffect(() => {
    document.body.classList.add("bg-home");
    return () => {
      document.body.classList.remove("bg-home");
    };
  }, []);

  useEffect(() => {
    if (location.state && location.state.source === 'game') {
      const { finalStressScore, gameStats } = location.state;
      setGameStressResult({ finalStressScore, gameStats });

      if (finalStressScore < SIS_THRESHOLDS.chill) setLevelIdx(0);
      else if (finalStressScore < SIS_THRESHOLDS.warmUp) setLevelIdx(1);
      else if (finalStressScore < SIS_THRESHOLDS.focused) setLevelIdx(2);
      else if (finalStressScore < SIS_THRESHOLDS.overdrive) setLevelIdx(3);
      else setLevelIdx(4);

      window.history.replaceState({}, document.title);
    } else {
      setGameStressResult(null);
    }
  }, [location.state]);

  useSerial((data) => {
    if (gameStressResult) return; 

    const val = parseInt(data);
    if (!isNaN(val)) {
      setBpm(val);
      setStressBallScore((prev) => prev + 1);

      if (val < 60) setLevelIdx(0);
      else if (val < 80) setLevelIdx(1);
      else if (val < 100) setLevelIdx(2);
      else if (val < 120) setLevelIdx(3);
      else setLevelIdx(4);
    }
  });

  return (
    <div className="w-full min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Background Images */}
      <img src="/images/awan1.png" alt="Awan 1" className="absolute left-0 top-0 w-1/3 min-w-[200px] max-w-[400px] -z-20" />
      <img src="/images/componentawan1.png" alt="" className="absolute left-0 top-0 -z-10 w-full" />
      <img src="/images/componentawan3.png" alt="" className="absolute left-0 top-20 w-full -z-10" />
      <img
        src="/images/hand_phone.png"
        alt="Hand holding phone"
        className="fixed left-0 bottom-24 w-[30vw] min-w-[250px] max-w-[400px] z-20 pointer-events-none select-none"
        style={{ maxHeight: "80vh" }}
      />

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center flex-1 pt-20 pb-10">
        <h1 className="text-white text-4xl font-bold mb-6 drop-shadow-lg">Stress Level Monitor</h1>

        {!gameStressResult && (
          <button
            id="connectSerial"
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Connect Stress Ball (BPM)
          </button>
        )}

        {/* Info Card */}
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center w-[350px] max-w-full">
          {gameStressResult ? (
            <>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Game Stress Report</h2>
              <div className="flex w-full justify-between items-center mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-700">GAME SIS</span>
                  <span className="text-4xl font-extrabold text-blue-900 bg-red-200 px-6 py-2 rounded-lg mt-1">
                    {gameStressResult.finalStressScore}
                  </span>
                </div>
                <div className="border-l-2 border-gray-300 h-16 mx-4"></div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-700">HITS</span>
                  <span className="text-3xl font-bold text-blue-600 mt-1">{gameStressResult.gameStats.successfulHits}</span>
                </div>
              </div>
              <div className="flex w-full justify-between items-center">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-700">MISSES</span>
                  <span className="text-3xl font-bold text-red-600 mt-1">{gameStressResult.gameStats.misses}</span>
                </div>
                <div className="border-l-2 border-gray-300 h-16 mx-4"></div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-700">OOZ</span>
                  <span className="text-3xl font-bold text-yellow-600 mt-1">{gameStressResult.gameStats.pressesOutOfZone}</span>
                </div>
              </div>
               <p className="text-sm text-gray-500 mt-4">Game Difficulty: {gameStressResult.gameStats.finalDifficulty}</p>
            </>
          ) : (
            <>
              <div className="flex w-full justify-between items-center mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-700">Interactions</span>
                  <span className="text-4xl font-extrabold text-blue-900 bg-blue-200 px-6 py-2 rounded-lg mt-1">
                    {stressBallScore}
                  </span>
                </div>
                <div className="border-l-2 border-gray-300 h-16 mx-4"></div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-700">BPM</span>
                  <span className="text-3xl font-bold text-blue-600 mt-1">
                    {bpm} bpm
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="text-xl font-semibold text-gray-700 mt-2 mb-4">
            Stress Level:{" "}
            <span className="font-bold" style={{ color: STRESS_LEVELS[levelIdx].color }}>
              {STRESS_LEVELS[levelIdx].label}
            </span>
          </div>
        </div>

        {/* Stress Level Icons */}
        <div className="flex gap-6 mt-10 mb-4">
          {STRESS_LEVELS.map((level) => (
            <div key={level.label} className="flex flex-col items-center">
              <img
                src={level.icon}
                alt={level.label}
                className="w-10 h-10 mb-1"
                style={{ filter: `drop-shadow(0 0 4px ${level.color})` }}
              />
              <span className="text-xs font-semibold" style={{ color: level.color }}>
                {level.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StressLevel;