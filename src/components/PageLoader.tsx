import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy"
    >
      <div className="text-center">
        {/* Logo Animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 mx-auto mb-6"
        >
          <img 
            src="/Logo_kppu.jpeg" 
            alt="Logo KPPU" 
            className="w-full h-full rounded-full object-contain"
          />
        </motion.div>
        
        {/* Loading Bar */}
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-full bg-gold rounded-full"
          />
        </div>
        
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="text-white mt-4 text-sm font-medium"
        >
          Memuat...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PageLoader;