import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy"
    >
      <div className="text-center relative">
        {/* Spinning Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-24 h-24 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="4"
              strokeDasharray="70 30"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
        
        {/* Static Logo */}
        <div className="w-16 h-16 mx-auto">
          <img
            src="/Logo_kppu.jpeg"
            alt="Logo KPPU"
            className="w-full h-full rounded-full object-contain"
          />
        </div>
        
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
          className="text-white text-sm font-medium mt-8"
        >
          Memuat...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PageLoader;