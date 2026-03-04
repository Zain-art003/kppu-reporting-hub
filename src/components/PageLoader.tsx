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
        {/* Spinning Logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <img
            src="/Logo_kppu.jpeg"
            alt="Logo KPPU"
            className="w-full h-full rounded-full object-contain"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
          className="text-white text-sm font-medium"
        >
          Memuat...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PageLoader;