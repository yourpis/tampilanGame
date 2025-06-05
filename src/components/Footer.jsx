const Footer = () => {
    return (
        <div className="relative">
            <img src="/images/awan4.png" alt="" className="absolute right-0 bottom-40 -z-20"/>
            <img src="/images/dinoputih.png" alt="" className="absolute bottom-32 left-50 z-10"/>
            <img src="/images/rumput.png" alt="" className="w-full -z-10"/>
            <footer className="px-16 w-full absolute flex items-center justify-between bottom-0 max-[780px]:px-8 max-[480px]:px-5 py-10 bg-[#386297]">
                <h1 className="text-white font-black text-5xl max-[1000px]:text-4xl max-[550px]:text-2xl max-[500px]:text-xl max-[440px]:text-lg max-[720px]:text-3xl max-[410px]:text-base max-[410px]:font-bold">StressPlay</h1>
                <p className="text-white open-sans max-[550px]:text-sm max-[400px]:text-xs">© 2024 StressPlay. All Rights Reserved.</p>
            </footer>
        </div>
    )
};

export default Footer;