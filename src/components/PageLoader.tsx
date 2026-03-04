import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy"
    >
      <div className="text-center">
        {/* Multiple Spinning Rings */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="20 80"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          
          {/* Middle Ring - counter rotate */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#FFD700"
                strokeWidth="3"
                strokeDasharray="30 70"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          
          {/* Inner Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="15 85"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          
          {/* Center Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/Logo_kppu.jpeg"
              alt="Logo KPPU"
              className="w-10 h-10 rounded-full object-contain"
            />
          </div>
        </div>
        
        {/* Pulsing Text */}
        <motion.p
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-gold text-lg font-bold"
        >
          WBS KPPU
        </motion.p>
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/60 text-sm mt-1"
        >
          Memuat...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PageLoader;