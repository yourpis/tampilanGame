// src/pages/AboutUsPage.jsx
import React, { useEffect } from 'react';

const AboutUsPage = () => {
    useEffect(() => {
        document.body.classList.add('bg-home'); 
        return () => {
            document.body.classList.remove('bg-home');
        };
    }, []);

    return (
        // Added a new div as a container for the entire page content, 
        // adjusting padding and margin for proper display.
        <div className="py-20"> {/* Adjust py-20 as needed to create space below Navbar */}
            {/* The content that was previously on HomePage.jsx */}
            <div className="w-full px-32 max-[1700px]:px-16 max-[480px]:px-5 max-[780px]:px-8 relative"> {/* Removed -mt-10 as it's not needed here */}
                {/* Ensure the id="about" is removed if it was present here or not needed for external linking */}
                <img src="/images/awan3.png" alt="" className="absolute left-0 -z-20 max-[1000px]:top-80"/>
                <img src="/images/componentawan3.png" alt="" className="absolute left-0 top-20 w-full -z-10"/>
                <div className="mx-auto flex items-center gap-4 w-max">
                    <img src="/images/danger.png" alt="" className="w-14 h-14 max-[720px]:w-10 max-[720px]:h-10"/>
                    <h1 className="text-white text-4xl max-[720px]:text-3xl max-[500px]:text-2xl font-bold">ABOUT StressPlay</h1>
                </div>
                <div className="mx-auto mt-10 max-[950px]:max-w-2xl max-w-3xl">
                    <h1 className="text-center font-bold text-4xl max-[720px]:text-3xl max-[500px]:text-2xl text-[#033560] mb-5">How to Use StressPlay</h1>
                    <p className="text-center font-medium text-3xl max-[950px]:text-2xl max-[550px]:text-xl max-[450px]:text-xl text-[#033560]">StressPlay is an interactive game that utilizes a stress ball to help you manage your stress while 
                        having fun. Let's learn how to use it!
                    </p>
                </div>
                <div className="grid grid-cols-4 max-[550px]:grid-cols-1 max-[1180px]:grid-cols-2 max-[1450px]:gap-10 max-[620px]:gap-5 gap-15 mt-10">
                    <div className="bg-white rounded-4xl">
                        <img src="/images/tanganbola.png" alt="" className="pt-8"/>
                        <div className="px-8 pb-8 mt-5">
                            <div className="flex gap-5">
                                <div className="relative h-10 w-10">
                                    <div className="absolute bg-[#196DB0] rounded-full max-[660px]:w-8 max-[660px]:h-8 h-10 w-10 flex items-center justify-center">
                                        <h1 className="rounded-full text-white font-bold text-lg max-[660px]:text-base z-20">1</h1>
                                    </div>
                                </div>
                                <h1 className="font-bold text-3xl/8 max-[1300px]:text-xl/6 max-[1180px]:text-3xl/8 max-[700px]:text-xl/6 max-[1500px]:text-2xl/7  max-[550px]:text-3xl/8 text-[#033560]">Prepare your stress ball</h1>
                            </div>
                            <h1 className="text-xl max-[1500px]:text-lg max-[1300px]:text-base max-[1180px]:text-xl max-[700px]:text-base max-[550px]:text-xl text-[#033560] font-medium">Hold your favorite stress ball comfortably in your</h1>
                        </div>
                    </div>
                    <div className="bg-white rounded-4xl">
                        <img src="/images/charge.png" alt="" className="pt-8"/>
                        <div className="px-8 pb-8 mt-5">
                            <div className="flex gap-5">
                                <div className="relative h-10 w-10">
                                    <div className="absolute bg-[#196DB0] rounded-full max-[660px]:w-8 max-[660px]:h-8 h-10 w-10 flex items-center justify-center">
                                        <h1 className="rounded-full text-white font-bold text-lg max-[660px]:text-base z-20">2</h1>
                                    </div>
                                </div>
                                <h1 className="font-bold text-3xl/8 max-[1300px]:text-xl/6 max-[1180px]:text-3xl/8 max-[700px]:text-xl/6 max-[1500px]:text-2xl/7  max-[550px]:text-3xl/8 text-[#033560]">Connect to the app</h1>
                            </div>
                            <h1 className="text-xl max-[1500px]:text-lg max-[1300px]:text-base max-[1180px]:text-xl max-[700px]:text-base max-[550px]:text-xl text-[#033560] font-medium">Plug the stress ball into your device</h1>
                        </div>
                    </div>
                    <div className="bg-white rounded-4xl">
                        <img src="/images/dino.png" alt="" className="pt-8"/>
                        <div className="px-8 pb-8 mt-5">
                            <div className="flex gap-5">
                                <div className="relative h-10 w-10">
                                    <div className="absolute bg-[#196DB0] rounded-full max-[660px]:w-8 max-[660px]:h-8 h-10 w-10 flex items-center justify-center">
                                        <h1 className="rounded-full text-white font-bold text-lg max-[660px]:text-base z-20">3</h1>
                                    </div>
                                </div>
                                <h1 className="font-bold text-3xl/8 max-[1300px]:text-xl/6 max-[1180px]:text-3xl/8 max-[700px]:text-xl/6 max-[1500px]:text-2xl/7  max-[550px]:text-3xl/8 text-[#033560]">Play the game!</h1>
                            </div>
                            <h1 className="text-xl max-[1500px]:text-lg max-[1300px]:text-base max-[1180px]:text-xl max-[700px]:text-base max-[550px]:text-xl text-[#033560] font-medium">Squeeze the stress ball to controll the character</h1>
                        </div>
                    </div>
                    <div className="bg-white rounded-4xl">
                        <img src="/images/diagram.png" alt="" className="pt-8"/>
                        <div className="px-8 pb-8 mt-5">
                            <div className="flex gap-5">
                                <div className="relative h-10 w-10">
                                    <div className="absolute bg-[#196DB0] rounded-full max-[660px]:w-8 max-[660px]:h-8 h-10 w-10 flex items-center justify-center">
                                        <h1 className="rounded-full text-white font-bold text-lg max-[660px]:text-base z-20">4</h1>
                                    </div>
                                </div>
                                <h1 className="font-bold text-3xl/8 max-[1300px]:text-xl/6 max-[1180px]:text-3xl/8 max-[700px]:text-xl/6 max-[1500px]:text-2xl/7  max-[550px]:text-3xl/8 text-[#033560]">Monitor your stress level</h1>
                            </div>
                            <h1 className="text-xl max-[1500px]:text-lg max-[1300px]:text-base max-[1180px]:text-xl max-[700px]:text-base max-[550px]:text-xl text-[#033560] font-medium">After playing, see how much you were stressed</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;