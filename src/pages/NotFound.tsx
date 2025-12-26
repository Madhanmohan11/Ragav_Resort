import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative text-center px-6 max-w-2xl">
        <h1 className="text-7xl md:text-8xl font-extrabold text-white drop-shadow-lg">
          404
        </h1>

        <p className="mt-4 text-2xl text-white/90 font-semibold">
          Lost in Paradise?
        </p>

        <p className="mt-2 text-white/70 text-lg">
          The page you’re looking for has drifted away like waves in the ocean.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block px-8 py-3 rounded-full text-white text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 shadow-xl hover:scale-105 transition transform duration-300"
        >
        Back to Login
        </Link>
      </div>

      {/* Decorative Waves */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-20"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
