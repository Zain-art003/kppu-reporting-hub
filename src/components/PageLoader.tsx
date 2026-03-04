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
        {/* Elegant Single Ring */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeDasharray="60 240"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          
          {/* Center Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/Logo_kppu.jpeg"
              alt="Logo KPPU"
              className="w-12 h-12 rounded-full object-contain"
            />
          </div>
        </div>
        
        {/* Elegant Text */}
        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gold text-sm font-medium tracking-wider"
        >
          MEMUAT...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PageLoader;