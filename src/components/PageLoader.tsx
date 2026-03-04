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
        {/* Glowing Ring with Pulse */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          {/* Outer Glow */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gold/20 blur-xl"
          />
          
          {/* Spinning Ring with Glow */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="4"
                strokeDasharray="50 150"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          
          {/* Inner Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="1"
                strokeDasharray="20 80"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
          </motion.div>
          
          {/* Center Logo with Glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 10px rgba(212, 175, 55, 0.3)",
                  "0 0 25px rgba(212, 175, 55, 0.6)",
                  "0 0 10px rgba(212, 175, 55, 0.3)"
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-14 h-14 rounded-full bg-navy p-1"
            >
              <img
                src="/Logo_kppu.jpeg"
                alt="Logo KPPU"
                className="w-full h-full rounded-full object-contain"
              />
            </motion.div>
          </div>
        </div>
        
        {/* Elegant Text with Fade */}
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-gold text-sm font-medium tracking-[0.3em]"
        >
          WBS KPPU
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PageLoader;