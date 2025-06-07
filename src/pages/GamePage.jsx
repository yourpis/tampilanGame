import { useEffect } from "react";
import PressurePlateGame from "../components/PressurePlateGame";

const GamePage = () => {
    useEffect(() => {
        document.body.classList.add('bg-home');
        return () => {
            document.body.classList.remove('bg-home');
        };
    }, []);

    const handleGameData = (data) => {
        if (data.gameEnded) {
            console.log("Game Ended! Final Stress Score:", data.stressScore);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center min-h-screen">
            {/* Title */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 text-center mb-10">
                <h1 className="text-[#344054] text-4xl sm:text-5xl lg:text-6xl font-bold">
                    Play The Stress Game
                </h1>
                <img
                    src="/images/gamepad.png"
                    alt="Gamepad Icon"
                    className="w-12 sm:w-16"
                />
            </div>

            {/* Render the PressurePlateGame here */}
            <div className="z-30">
                <PressurePlateGame onGameUpdate={handleGameData} />
            </div>

            {/* Removed: Display last game result section */}

        </div>
    );
};

export default GamePage;