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

const STRIKE_ZONE_WIDTH = 60; // How precise the hit needs to be

// Nail Constants
const NAIL_WIDTH = 10;
const NAIL_HEIGHT = 50;
const NAIL_HEAD_HEIGHT = 15;
// NAIL_Y_ALIGNMENT: where the center of the nail head should be drawn
// This needs to align with the hammer head's Y position when hammer is at STRIKE_ANGLE (0 radians)
// Hammer head's vertical center will be at HAMMER_PIVOT_Y - HAMMER_HANDLE_THICKNESS / 2 when angle is 0
const NAIL_Y_ALIGNMENT = HAMMER_PIVOT_Y - (HAMMER_HANDLE_THICKNESS / 2) - (NAIL_HEAD_HEIGHT / 2);
const NAIL_SINK_SPEED = 5;
const NAIL_INITIAL_SPEED = 5;
const NAIL_MAX_SPEED = 20;
const SPEED_INCREMENT_INTERVAL = 5;

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

    // Trigger hammer animation (downward strike)
    if (!hammer.current.isAnimating) { // Only start animation if not already animating
        hammer.current.isAnimating = true;
        hammer.current.animationStartTime = performance.now();
        hammer.current.direction = 1; // Downward
    }
    
    // Calculate the hammer's head strike X position when horizontal
    // This is HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH (where handle ends)
    const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET;

    // Find the nail that is currently closest to the hammer and not yet hit
    const targetNail = nails.current.find(nail => !nail.isHit && nail.x + NAIL_WIDTH > HAMMER_PIVOT_X); // Check if nail is roughly near hammer's area

    if (targetNail) {
        // Check if the nail's current position is within the effective strike zone
        const nailCenter = targetNail.x + NAIL_WIDTH / 2;

        const isWithinStrikeZone = (
            // The nail's center should be horizontally aligned with the hammer's head strike point
            nailCenter > (hammerStrikeX - STRIKE_ZONE_WIDTH / 2) &&
            nailCenter < (hammerStrikeX + STRIKE_ZONE_WIDTH / 2)
        );

        if (isWithinStrikeZone) {
            // Successful Hit!
            targetNail.isHit = true;
            setSuccessfulHits(prev => {
                const newHits = prev + 1;
                if (newHits % SPEED_INCREMENT_INTERVAL === 0 && currentNailSpeed < NAIL_MAX_SPEED) {
                    setCurrentNailSpeed(prevSpeed => prevSpeed + 1);
                }
                return newHits;
            });
        } else {
            // Miss! Pressed outside the zone
            setPressesOutOfZone(prev => prev + 1);
            setHealth(prev => {
                const newHealth = prev - 1;
                if (newHealth <= 0) {
                    endGame();
                }
                return newHealth;
            });
        }
    } else {
        // Pressed spacebar but no nail was in target area (early press / no nail)
        setPressesOutOfZone(prev => prev + 1);
        setHealth(prev => {
            const newHealth = prev - 1;
            if (newHealth <= 0) {
                endGame();
            }
            return newHealth;
        });
    }
  }, [isStarted, isGameOver, initializeGame, successfulHits, pressesOutOfZone, health, currentNailSpeed]);

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

      // Update hammer animation
      if (hammer.current.isAnimating) {
        const elapsed = timestamp - hammer.current.animationStartTime;
        let progress = Math.min(1, elapsed / HAMMER_ANIM_DURATION_MS); // Progress from 0 to 1

        if (hammer.current.direction === 1) { // Swinging down
          hammer.current.currentAngle = HAMMER_IDLE_ANGLE + (HAMMER_STRIKE_ANGLE - HAMMER_IDLE_ANGLE) * progress;
          if (progress >= 1) {
            hammer.current.direction = -1; // Start swinging up
            hammer.current.animationStartTime = timestamp; // Reset start time for upward swing
          }
        } else if (hammer.current.direction === -1) { // Swinging up
          hammer.current.currentAngle = HAMMER_STRIKE_ANGLE + (HAMMER_IDLE_ANGLE - HAMMER_STRIKE_ANGLE) * progress;
          if (progress >= 1) {
            hammer.current.isAnimating = false; // Animation finished
            hammer.current.direction = 0; // Idle
            hammer.current.currentAngle = HAMMER_IDLE_ANGLE; // Snap to idle angle
          }
        }
      }


      // Spawn new nails
      if (timestamp - lastNailSpawnTime.current > NAIL_SPAWN_INTERVAL_MS) {
        nails.current.push({
          id: timestamp, // Unique ID
          x: GAME_WIDTH, // Start from right edge
          sunkDepth: 0, // How much it has sunk (for animation)
          isHit: false, // Whether it has been successfully hit
          passed: false, // Whether it has passed the hammer without being hit
        });
        lastNailSpawnTime.current = timestamp;
      }

      // Update and filter nails
      nails.current = nails.current.filter(nail => {
        if (nail.isHit) {
          nail.sunkDepth += NAIL_SINK_SPEED; // Sink faster
          if (nail.sunkDepth >= NAIL_HEIGHT - NAIL_HEAD_HEIGHT + 5) { // Sunk fully (approx height)
            return false; // Remove nail from array
          }
        } else {
          nail.x -= currentNailSpeed; // Move nail horizontally

          // Check if nail passed the hammer without being hit
          // A nail has passed if its leading edge is past the hammer's strike X position
          const hammerStrikeX = HAMMER_PIVOT_X + HAMMER_HANDLE_LENGTH + HAMMER_HEAD_WIDTH / 2 + HIT_ZONE_HORIZONTAL_OFFSET; // Calculate strike X for comparison
          if (nail.x + NAIL_WIDTH < hammerStrikeX && !nail.passed) { // Adjusted to be just past hammer strike X
            nail.passed = true;
            setMisses(prev => prev + 1); // Count as a miss
            setHealth(prev => {
              const newHealth = prev - 1;
              if (newHealth <= 0) {
                endGame();
              }
              return newHealth;
            });
          }
          // Remove nails that are fully off screen and not hit
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
      cancelAnimationFrame(animationFrameId.current);
      setIsStarted(false);
      setIsGameOver(true);
      
      const finalSIS = calculateSIS(successfulHits, misses, pressesOutOfZone, currentNailSpeed);
      setStressIndicationScore(finalSIS);

      if(onGameUpdate) {
        onGameUpdate({
          stressScore: finalSIS,
          successfulHits,
          misses,
          pressesOutOfZone,
          gameEnded: true
        });
      }
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
                onClick={() => navigate("/stressLevel")}
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