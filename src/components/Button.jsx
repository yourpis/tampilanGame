import { Link } from 'react-router-dom';

const Button = ({ children, to, onClick, className = "", disabled = false }) => {
    if (to) {
        return (
            <Link
                to={to}
                className={`bg-[#316BE7] text-2xl flex items-center px-12 py-4 text-white 
                    font-bold rounded-xl max-[550px]:text-xl w-max text-center
                    transition duration-300 hover:bg-blue-700 ${className}`}
                style={disabled ? { pointerEvents: 'none', opacity: 0.5 } : {}}
            >
                {children}
            </Link>
        );
    }
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`bg-[#316BE7] text-2xl flex items-center px-12 py-4 text-white 
                font-bold rounded-xl max-[550px]:text-xl w-max text-center
                transition duration-300 ${
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                } ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
