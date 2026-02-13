import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pageVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: "easeOut",
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.1,
      }
    }
  };

  return (
    <motion.div
      className="page-transition-wrapper"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}