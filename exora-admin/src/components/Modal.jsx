import { motion } from 'framer-motion';

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </div>
);
export default Modal;