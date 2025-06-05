import { NavLink } from 'react-router-dom'
import { Link as ScrollLink } from 'react-scroll';

const Navbar = ({ links }) => {
  return (
    <nav className="w-full top-0 px-16 max-[480px]:px-5 max-[780px]:px-8 py-5 z-[99999]">
      <div className="flex max-[420px]:flex-col items-center">
        <div className="flex items-center max-[420px]:mr-auto">
          <NavLink to="/" className="">
            <span className="text-white font-black text-5xl max-[1000px]:text-4xl max-[550px]:text-2xl max-[500px]:text-xl max-[440px]:text-lg max-[720px]:text-3xl max-[420px]:text-xl max-[410px]:font-bold ">StressPlay</span>
          </NavLink>
        </div>
        <div className="flex gap-10 text-lg font-bold max-[610px]:gap-5 max-[720px]:text-base max-[510px]:text-sm max-[440px]:text-xs max-[440px]:font-normal max-[510px]:gap-3 ml-auto relative items-center">
          {links.map((link) =>
            link.type === "scroll" ? (
              <ScrollLink
                key={link.id}
                to={link.path}
                smooth={true}
                duration={500}
                spy={true}
                offset={-70}
                className="max-[480px]:text-base text-white cursor-pointer"
                activeClass="active"
              >
                <span>{link.name}</span>
              </ScrollLink>
            ) : (
              <NavLink
                key={link.id}
                to={link.path}
                className={({ isActive }) =>
                  isActive
                    ? "text-white max-[480px]:text-base active"
                    : "max-[480px]:text-base text-white"
                }
              >
                <span>{link.name}</span>
              </NavLink>
            )
          )}

        </div>
      </div>
    </nav>
  )
}

export default Navbar
