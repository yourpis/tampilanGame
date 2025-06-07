import Button from "../components/Button"
import { useEffect } from "react";

const HomePage = () => {
    useEffect(() => {
      document.body.classList.add('bg-home');
      return () => {
        document.body.classList.remove('bg-home');
      };
    }, []);
  return (
    <div className="mt-20 w-full">
        <div className="flex max-[1200px]:flex-wrap-reverse justify-center relative">
            <img src="/images/awan1.png" alt="" className="absolute left-0 top-0 -z-20"/>
            <img src="/images/componentawan1.png" alt="" className="absolute left-0 top-0 -z-10 w-full"/>
            <div className="w-1/2 max-[1200px]:pr-16 max-[480px]:pr-5 max-[780px]:pr-8 max-[1200px]:w-full relative">
                <img src="/images/dekorasilaptop.png" alt="" className="absolute -top-10 w-[90%] left-1/2 -translate-x-1/2"/>
                <img src="/images/laptop.png" alt="" className="max-[1200px]:w-full"/>
            </div>
            <div className="w-1/2 max-[1200px]:w-full flex items-center">
                <div className="max-[1200px]:px-16 max-[480px]:px-5 max-[780px]:px-8">
                    <h1 className="text-[#344054] text-shadow-lg font-bold text-6xl max-[600px]:text-5xl max-[460px]:text-3xl mb-8 max-[510px]:mb-5">Play, squeeze,
                        <img src="/images/love.png" alt="icon" className="inline w-16 h-w-16 mx-2" />
                        <br />
                        know your stress !</h1>
                    <Button to="/game">Try Now</Button>
                </div>
            </div>
            <img src="/images/awan2.png" alt="" className="absolute right-0 -bottom-50 -z-20"/>
        </div>
        
        {/* The entire "About" section div is removed from here */}

    </div>
  )
}

export default HomePage