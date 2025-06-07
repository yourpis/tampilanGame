import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 600;

const HAMMER_PIVOT_X = 150;
const HAMMER_PIVOT_Y = GAME_HEIGHT / 2 + 100;

const HAMMER_HANDLE_LENGTH = 150;
const HAMMER_HANDLE_THICKNESS = 20;
const HAMMER_HEAD_WIDTH = 80;
const HAMMER_HEAD_HEIGHT = 40;

const HAMMER_IDLE_ANGLE = 0;
const HAMMER_STRIKE_ANGLE = Math.PI / 2;
const HAMMER_ANIM_DURATION_MS = 100;

const HIT_ZONE_HORIZONTAL_OFFSET = -20;

const STRIKE_ZONE_WIDTH = 100;

const NAIL_WIDTH = 10;
const NAIL_HEIGHT = 50;
const NAIL_HEAD_HEIGHT = 15;

const NAIL_Y_ALIGNMENT = HAMMER_PIVOT_Y - (HAMMER_HANDLE_THICKNESS / 2) - (NAIL_HEAD_HEIGHT / 2);
const NAIL_SINK_SPEED = 5;
const NAIL_INITIAL_SPEED = 3;
const NAIL_MAX_SPEED = 12;
const SPEED_INCREMENT_INTERVAL = 5;
const SPEED_FLUCTUATION_RANGE = 2;
const SPEED_CHANGE_INTERVAL = 1000;

const NAIL_SPAWN_INTERVAL_MS = 1500;

const MAX_MISSES = 3;

const calculateSIS = (successfulHits, misses, pressesOutOfZone, currentNailSpeed) => {
  if (successfulHits === 0 && (misses > 0 || pressesOutOfZone > 0)) {
    return (misses * 50) + (pressesOutOfZone * 100) + (currentNailSpeed * 10);
  } else if (successfulHits === 0 && misses === 0 && pressesOutOfZone === 0) {
    return 0;
  }

  const missPenalty = misses * 25;
  const outOfZonePenalty = pressesOutOfZone * 35;
  const speedStress = currentNailSpeed * 15;

  const rawStress = (missPenalty + outOfZonePenalty + speedStress);
  const sis = rawStress / (successfulHits + 1);
  return Math.max(0, Math.floor(sis));
};


export default function PressurePlateGame({ onGameUpdate }) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const navigate = useNavigate();

  const [isStarted, setIsStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [successfulHits, setSuccessfulHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [pressesOutOfZone, setPressesOutOfZone] = useState(0);
  const [health, setHealth] = useState(MAX_MISSES);
  const [stressIndicationScore, setStressIndicationScore] = useState(0);
  const [currentNailSpeed, setCurrentNailSpeed] = useState(NAIL_INITIAL_SPEED);
  const lastSpeedChangeTime = useRef(0);
  
  const nails = useRef([]);
  const lastNailSpawnTime = useRef(0);

  const hammer = useRef({
    currentAngle: HAMMER_IDLE_ANGLE,
    isAnimating: false,
    animationStartTime: 0,
    direction: 0
  });

  const initializeGame = useCallback(() => {
    setIsGameOver(false);
    setIsStarted(true);
    setSuccessfulHits(0);
    setMisses(0);
    setPressesOutOfZone(0);
    setHealth(MAX_MISSES);
    setStressIndicationScore(0);
    setCurrentNailSpeed(NAIL_INITIAL_SPEED);
    
    nails.current = [];
    lastNailSpawnTime.current = performance.now();
    hammer.current = {
      currentAngle: HAMMER_IDLE_ANGLE,
      isAnimating: false,
      animationStartTime: 0,
      direction: 0
    };
  }, []);

  const handleSpacebarPress = useCallback(() => {
    if (isGameOver) {
      initializeGame();
      return;
    }

    if (!isStarted) {
      initializeGame();
      return;
    }

    if (hammer.current.isAnimating) {
      return;
    }

    hammer.current.isAnimating = true;
    hammer.current.animationStartTime = performance.now();
    hammer.current.direction = 1;
    
    const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET;
    const strikeZoneLeft = hammerStrikeX - STRIKE_ZONE_WIDTH / 2;
    const strikeZoneRight = hammerStrikeX + STRIKE_ZONE_WIDTH / 2;

    const targetNail = nails.current.find(nail => {
      if (nail.isHit) return false;
      const nailCenter = nail.x + NAIL_WIDTH / 2;
      return nailCenter >= strikeZoneLeft && nailCenter <= strikeZoneRight;
    });

    if (targetNail) {
      targetNail.isHit = true;
      setSuccessfulHits(prev => {
        const newHits = prev + 1;
        if (newHits % SPEED_INCREMENT_INTERVAL === 0 && currentNailSpeed < NAIL_MAX_SPEED) {
          setCurrentNailSpeed(prevSpeed => prevSpeed + 1);
        }
        return newHits;
      });
    } else {
      setPressesOutOfZone(prev => prev + 1);
    }
  }, [isStarted, isGameOver, initializeGame, currentNailSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const gameLoop = (timestamp) => {
      if (!isStarted || isGameOver) {
        draw(ctx);
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (timestamp - lastSpeedChangeTime.current > SPEED_CHANGE_INTERVAL) {
        const fluctuation = (Math.random() * 2 - 1) * SPEED_FLUCTUATION_RANGE;
        setCurrentNailSpeed(prevSpeed => {
          const newSpeed = prevSpeed + fluctuation;
          return Math.max(NAIL_INITIAL_SPEED, Math.min(NAIL_MAX_SPEED, newSpeed));
        });
        lastSpeedChangeTime.current = timestamp;
      }

      if (hammer.current.isAnimating) {
        const elapsed = timestamp - hammer.current.animationStartTime;
        let progress = Math.min(1, elapsed / HAMMER_ANIM_DURATION_MS);

        if (hammer.current.direction === 1) {
          hammer.current.currentAngle = HAMMER_IDLE_ANGLE + (HAMMER_STRIKE_ANGLE - HAMMER_IDLE_ANGLE) * progress;
          if (progress >= 1) {
            hammer.current.direction = -1;
            hammer.current.animationStartTime = timestamp;
          }
        } else if (hammer.current.direction === -1) {
          hammer.current.currentAngle = HAMMER_STRIKE_ANGLE + (HAMMER_IDLE_ANGLE - HAMMER_STRIKE_ANGLE) * progress;
          if (progress >= 1) {
            hammer.current.isAnimating = false;
            hammer.current.direction = 0;
            hammer.current.currentAngle = HAMMER_IDLE_ANGLE;
          }
        }
      }

      if (timestamp - lastNailSpawnTime.current > NAIL_SPAWN_INTERVAL_MS) {
        nails.current.push({
          id: timestamp,
          x: GAME_WIDTH,
          sunkDepth: 0,
          isHit: false,
          passed: false,
        });
        lastNailSpawnTime.current = timestamp;
      }

      nails.current = nails.current.filter(nail => {
        if (nail.isHit) {
          nail.sunkDepth += NAIL_SINK_SPEED;
          if (nail.sunkDepth >= NAIL_HEIGHT - NAIL_HEAD_HEIGHT + 5) {
            return false;
          }
        } else {
          nail.x -= currentNailSpeed;

          const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET;
          const strikeZoneLeft = hammerStrikeX - STRIKE_ZONE_WIDTH / 2;
          const strikeZoneRight = hammerStrikeX + STRIKE_ZONE_WIDTH / 2;

          if (nail.x + NAIL_WIDTH < strikeZoneLeft && !nail.passed) {
            nail.passed = true;
            const newMisses = misses + 1;
            const newHealth = health - 1;
            
            setMisses(newMisses);
            setHealth(newHealth);
            
            if (newHealth <= 0) {
              requestAnimationFrame(() => {
                endGame();
              });
            }
          }
          if (nail.x < -NAIL_WIDTH) {
            return false;
          }
        }
        return true;
      });

      draw(ctx);
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    const draw = (ctx) => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = "#A0522D";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#D2B48C";
      ctx.fillRect(0, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT + 5, GAME_WIDTH, GAME_HEIGHT - (NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT + 5));

      drawHammer(ctx, hammer.current.currentAngle);

      nails.current.forEach(nail => {
        if (!nail.isHit) {
          ctx.fillStyle = "silver";
          ctx.fillRect(nail.x, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT, NAIL_WIDTH, NAIL_HEIGHT - NAIL_HEAD_HEIGHT);
          ctx.fillStyle = "darkgray";
          ctx.beginPath();
          ctx.arc(nail.x + NAIL_WIDTH / 2, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT / 2, NAIL_HEAD_HEIGHT / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
            ctx.fillStyle = "silver";
            ctx.fillRect(nail.x, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT + nail.sunkDepth, NAIL_WIDTH, NAIL_HEIGHT - NAIL_HEAD_HEIGHT - nail.sunkDepth);
            
            if (NAIL_HEAD_HEIGHT - nail.sunkDepth > 0) {
                ctx.fillStyle = "darkgray";
                ctx.beginPath();
                ctx.arc(nail.x + NAIL_WIDTH / 2, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT / 2 + nail.sunkDepth, NAIL_HEAD_HEIGHT / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
      });

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Hits: ${successfulHits}`, 10, 30);
      ctx.fillText(`Misses: ${misses}`, 10, 60);
      ctx.fillText(`OOZ: ${pressesOutOfZone}`, 10, 90);
      ctx.fillText(`Speed: ${currentNailSpeed.toFixed(0)}`, 10, 120);
      ctx.fillText(`Health: ${health}`, 10, 150);
      ctx.fillText(`SIS: ${stressIndicationScore}`, 10, 180);

      if (!isStarted && !isGameOver) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press Spacebar to Start", GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.textAlign = "left";
      } else if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        ctx.font = "25px Arial";
        ctx.fillText(`Final SIS: ${stressIndicationScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText("Press Spacebar to Restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
        ctx.textAlign = "left";
      }
    };

    const drawHammer = (ctx, angle) => {
      ctx.save();

      ctx.translate(HAMMER_PIVOT_X, HAMMER_PIVOT_Y);
      ctx.rotate(angle);
      ctx.fillStyle = "brown";
      ctx.fillRect(-HAMMER_HANDLE_THICKNESS / 2, -HAMMER_HANDLE_LENGTH, HAMMER_HANDLE_THICKNESS, HAMMER_HANDLE_LENGTH);

      ctx.fillStyle = "darkgray";
      ctx.fillRect(-HAMMER_HEAD_WIDTH / 2, -HAMMER_HANDLE_LENGTH - HAMMER_HEAD_HEIGHT, HAMMER_HEAD_WIDTH, HAMMER_HEAD_HEIGHT);

      ctx.restore();
    };


    const endGame = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      const finalSIS = calculateSIS(successfulHits, misses, pressesOutOfZone, currentNailSpeed);
      
      Promise.resolve().then(() => {
        setIsStarted(false);
        setIsGameOver(true);
        setStressIndicationScore(finalSIS);

        const gameData = {
          stressScore: finalSIS,
          successfulHits,
          misses,
          pressesOutOfZone,
          gameEnded: true
        };

        if (onGameUpdate) {
          onGameUpdate(gameData);
        }
      });
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isStarted, isGameOver, successfulHits, misses, pressesOutOfZone, health, currentNailSpeed, stressIndicationScore, onGameUpdate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleSpacebarPress();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSpacebarPress]);

  useEffect(() => {
      let intervalId;
      if (isStarted && !isGameOver) {
          intervalId = setInterval(() => {
              const currentSIS = calculateSIS(successfulHits, misses, pressesOutOfZone, currentNailSpeed);
              setStressIndicationScore(currentSIS);
              if (onGameUpdate) {
                  onGameUpdate({ 
                      stressScore: currentSIS, 
                      successfulHits, 
                      misses, 
                      pressesOutOfZone 
                  });
              }
          }, 1000);
      }
      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, [isStarted, isGameOver, successfulHits, misses, pressesOutOfZone, currentNailSpeed, onGameUpdate]);


  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Hammer Time!</h2>
      <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="border rounded bg-white shadow-lg" />
      
      <div className="mt-4 flex gap-4">
        <button
          onClick={handleSpacebarPress}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300"
        >
          {isStarted ? "Press Spacebar to Hammer" : (isGameOver ? "Restart Game" : "Start Game")}
        </button>
        
        {isGameOver && (
            <button
                onClick={() => navigate("/stressLevel", {
                    state: {
                        source: 'game',
                        finalStressScore: stressIndicationScore,
                        gameStats: {
                            successfulHits,
                            misses,
                            pressesOutOfZone,
                            finalDifficulty: currentNailSpeed
                        }
                    }
                })}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition duration-300"
            >
                Go to Stress Level Page
            </button>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Hammer the nail when its head aligns with the yellow strike zone!
      </p>
    </div>
  );
}