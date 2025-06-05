// src/components/PressurePlateGame.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Game Constants
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 600;

// Hammer Animation Constants
const HAMMER_PIVOT_X = 150; // X position of the hammer's base pivot point
const HAMMER_PIVOT_Y = GAME_HEIGHT / 2 + 100; // Y position of the hammer's base pivot point

const HAMMER_HANDLE_LENGTH = 150; // Length of the hammer handle
const HAMMER_HANDLE_THICKNESS = 20; // Thickness of the hammer handle
const HAMMER_HEAD_WIDTH = 80;    // Width of the hammer head
const HAMMER_HEAD_HEIGHT = 40;   // Height of the hammer head

// **THE CRUCIAL ANGLE CORRECTION BASED ON YOUR DRAWING LOGIC**
// Hammer draws horizontally at 0 radians.
// To be vertical (idle), rotate 90 degrees clockwise = Math.PI / 2
// To be horizontal (strike), rotate 0 degrees = 0
const HAMMER_IDLE_ANGLE = 0;       // (90 degrees clockwise from horizontal, makes it vertical)
const HAMMER_STRIKE_ANGLE = Math.PI / 2;             // (0 degrees, makes it horizontal)
const HAMMER_ANIM_DURATION_MS = 100; // Duration of one swing down or up

const HIT_ZONE_HORIZONTAL_OFFSET = -20;

const STRIKE_ZONE_WIDTH = 100; // Increased from 60 to make it easier to hit nails

// Nail Constants
const NAIL_WIDTH = 10;
const NAIL_HEIGHT = 50;
const NAIL_HEAD_HEIGHT = 15;
// NAIL_Y_ALIGNMENT: where the center of the nail head should be drawn
// This needs to align with the hammer head's Y position when hammer is at STRIKE_ANGLE (0 radians)
// Hammer head's vertical center will be at HAMMER_PIVOT_Y - HAMMER_HANDLE_THICKNESS / 2 when angle is 0
const NAIL_Y_ALIGNMENT = HAMMER_PIVOT_Y - (HAMMER_HANDLE_THICKNESS / 2) - (NAIL_HEAD_HEIGHT / 2);
const NAIL_SINK_SPEED = 5;
const NAIL_INITIAL_SPEED = 3; // Reduced from 5 to make initial speed slower
const NAIL_MAX_SPEED = 12; // Reduced from 20 to make maximum speed slower
const SPEED_INCREMENT_INTERVAL = 5;
const SPEED_FLUCTUATION_RANGE = 2; // How much the speed can vary up or down
const SPEED_CHANGE_INTERVAL = 1000; // How often the speed changes (in ms)

const NAIL_SPAWN_INTERVAL_MS = 1500;

const MAX_MISSES = 3;

// Function to calculate Stress Indication Score (SIS)
const calculateSIS = (successfulHits, misses, pressesOutOfZone, currentNailSpeed) => {
  if (successfulHits === 0 && (misses > 0 || pressesOutOfZone > 0)) {
    return (misses * 50) + (pressesOutOfZone * 100) + (currentNailSpeed * 10);
  } else if (successfulHits === 0 && misses === 0 && pressesOutOfZone === 0) {
    return 0; // No activity
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

  // Game state
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

  // Hammer animation state
  const hammer = useRef({
    currentAngle: HAMMER_IDLE_ANGLE,
    isAnimating: false,
    animationStartTime: 0,
    direction: 0 // 0=idle, 1=down, -1=up
  });


  // Function to handle game restart/start
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
    hammer.current = { // Reset hammer animation state
      currentAngle: HAMMER_IDLE_ANGLE,
      isAnimating: false,
      animationStartTime: 0,
      direction: 0
    };
  }, []);

  // Function to handle spacebar press (Hammer strike)
  const handleSpacebarPress = useCallback(() => {
    if (isGameOver) {
      initializeGame();
      return;
    }

    if (!isStarted) {
      initializeGame();
      return;
    }

    // Prevent multiple rapid presses
    if (hammer.current.isAnimating) {
      return;
    }

    // Trigger hammer animation (downward strike)
    hammer.current.isAnimating = true;
    hammer.current.animationStartTime = performance.now();
    hammer.current.direction = 1; // Downward
    
    // Calculate the hammer's head strike X position when horizontal
    const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET;
    const strikeZoneLeft = hammerStrikeX - STRIKE_ZONE_WIDTH / 2;
    const strikeZoneRight = hammerStrikeX + STRIKE_ZONE_WIDTH / 2;

    // Find the nail that is currently within the strike zone
    const targetNail = nails.current.find(nail => {
      if (nail.isHit) return false;
      const nailCenter = nail.x + NAIL_WIDTH / 2;
      // Check if nail's center is within the strike zone
      return nailCenter >= strikeZoneLeft && nailCenter <= strikeZoneRight;
    });

    if (targetNail) {
      // Successful Hit! (nail is in strike zone)
      targetNail.isHit = true;
      setSuccessfulHits(prev => {
        const newHits = prev + 1;
        if (newHits % SPEED_INCREMENT_INTERVAL === 0 && currentNailSpeed < NAIL_MAX_SPEED) {
          setCurrentNailSpeed(prevSpeed => prevSpeed + 1);
        }
        return newHits;
      });
    } else {
      // Pressed spacebar but no nail was in strike zone
      setPressesOutOfZone(prev => prev + 1);
    }
  }, [isStarted, isGameOver, initializeGame, currentNailSpeed]);

  // Game loop
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

      // Update speed with random fluctuation
      if (timestamp - lastSpeedChangeTime.current > SPEED_CHANGE_INTERVAL) {
        const fluctuation = (Math.random() * 2 - 1) * SPEED_FLUCTUATION_RANGE;
        setCurrentNailSpeed(prevSpeed => {
          const newSpeed = prevSpeed + fluctuation;
          // Keep speed within bounds
          return Math.max(NAIL_INITIAL_SPEED, Math.min(NAIL_MAX_SPEED, newSpeed));
        });
        lastSpeedChangeTime.current = timestamp;
      }

      // Update hammer animation
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

      // Spawn new nails
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

      // Update and filter nails
      nails.current = nails.current.filter(nail => {
        if (nail.isHit) {
          nail.sunkDepth += NAIL_SINK_SPEED;
          if (nail.sunkDepth >= NAIL_HEIGHT - NAIL_HEAD_HEIGHT + 5) {
            return false;
          }
        } else {
          nail.x -= currentNailSpeed;

          // Check if nail passed the strike zone without being hit
          const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET;
          const strikeZoneLeft = hammerStrikeX - STRIKE_ZONE_WIDTH / 2;
          const strikeZoneRight = hammerStrikeX + STRIKE_ZONE_WIDTH / 2;

          // Register miss when nail's right edge passes the strike zone
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

    // Drawing function
    const draw = (ctx) => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Background (Workbench/Wall)
      ctx.fillStyle = "#A0522D"; // Sienna color for wood
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#D2B48C"; // Light brown for workbench top
      ctx.fillRect(0, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT + 5, GAME_WIDTH, GAME_HEIGHT - (NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT + 5)); // Adjusted workbench Y to align with nail base

      // Draw Strike Zone (visual guide for player)
      // Positioned where the hammer head lands
      const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET; // X where hammer head is at strike angle
      const strikeZoneYCenter = NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT / 2; // Y center for strike zone

      ctx.fillStyle = "rgba(255, 255, 0, 0.4)"; // Semi-transparent yellow
      ctx.fillRect(hammerStrikeX - STRIKE_ZONE_WIDTH / 2, strikeZoneYCenter - NAIL_HEAD_HEIGHT / 2, STRIKE_ZONE_WIDTH, NAIL_HEAD_HEIGHT); // Align with nail head
      ctx.strokeStyle = "orange"; // Add outline for clarity
      ctx.lineWidth = 2;
      ctx.strokeRect(hammerStrikeX - STRIKE_ZONE_WIDTH / 2, strikeZoneYCenter - NAIL_HEAD_HEIGHT / 2, STRIKE_ZONE_WIDTH, NAIL_HEAD_HEIGHT);
      ctx.lineWidth = 1;

      // Draw Hammer
      drawHammer(ctx, hammer.current.currentAngle);

      // Draw Nails
      nails.current.forEach(nail => {
        if (!nail.isHit) {
          // Draw unhit nail
          ctx.fillStyle = "silver"; // Nail shaft
          ctx.fillRect(nail.x, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT, NAIL_WIDTH, NAIL_HEIGHT - NAIL_HEAD_HEIGHT); // Draw shaft below head
          ctx.fillStyle = "darkgray"; // Nail head
          ctx.beginPath();
          ctx.arc(nail.x + NAIL_WIDTH / 2, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT / 2, NAIL_HEAD_HEIGHT / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
            // Draw sinking nail (only the part that hasn't sunk)
            ctx.fillStyle = "silver";
            ctx.fillRect(nail.x, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT + nail.sunkDepth, NAIL_WIDTH, NAIL_HEIGHT - NAIL_HEAD_HEIGHT - nail.sunkDepth);
            
            // Draw sinking head only if it's still visible
            if (NAIL_HEAD_HEIGHT - nail.sunkDepth > 0) {
                ctx.fillStyle = "darkgray";
                ctx.beginPath();
                ctx.arc(nail.x + NAIL_WIDTH / 2, NAIL_Y_ALIGNMENT + NAIL_HEAD_HEIGHT / 2 + nail.sunkDepth, NAIL_HEAD_HEIGHT / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
      });


      // Draw Stats
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Hits: ${successfulHits}`, 10, 30);
      ctx.fillText(`Misses: ${misses}`, 10, 60);
      ctx.fillText(`OOZ: ${pressesOutOfZone}`, 10, 90);
      ctx.fillText(`Speed: ${currentNailSpeed.toFixed(0)}`, 10, 120);
      ctx.fillText(`Health: ${health}`, 10, 150);
      ctx.fillText(`SIS: ${stressIndicationScore}`, 10, 180);

      // Game Over / Start Screen Overlay
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

    // Helper function to draw the hammer at a given angle
    const drawHammer = (ctx, angle) => {
      ctx.save(); // Save the current canvas state

      // Translate to the pivot point (bottom of hammer handle)
      ctx.translate(HAMMER_PIVOT_X, HAMMER_PIVOT_Y);
      // Rotate the canvas by the given angle
      ctx.rotate(angle);

      // Draw hammer handle (relative to the pivot at 0,0)
      // The handle is drawn starting from the pivot and extending UPWARDS along the negative Y-axis.
      ctx.fillStyle = "brown";
      ctx.fillRect(-HAMMER_HANDLE_THICKNESS / 2, -HAMMER_HANDLE_LENGTH, HAMMER_HANDLE_THICKNESS, HAMMER_HANDLE_LENGTH);

      // Draw hammer head (relative to the top of the handle)
      // The head is positioned at the top of the handle, extending ABOVE it.
      ctx.fillStyle = "darkgray";
      ctx.fillRect(-HAMMER_HEAD_WIDTH / 2, -HAMMER_HANDLE_LENGTH - HAMMER_HEAD_HEIGHT, HAMMER_HEAD_WIDTH, HAMMER_HEAD_HEIGHT);

      ctx.restore(); // Restore the canvas to its previous state
    };


    const endGame = () => {
      // Cancel any ongoing animations first
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      // Calculate final score before state updates
      const finalSIS = calculateSIS(successfulHits, misses, pressesOutOfZone, currentNailSpeed);
      
      // Batch all state updates together
      Promise.resolve().then(() => {
        setIsStarted(false);
        setIsGameOver(true);
        setStressIndicationScore(finalSIS);

        // Ensure game data is properly formatted before sending
        const gameData = {
          stressScore: finalSIS,
          successfulHits,
          misses,
          pressesOutOfZone,
          gameEnded: true
        };

        // Send game update after state is settled
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

  // Keyboard Input for Spacebar
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

  // Periodic SIS update (only if game is active and not over)
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