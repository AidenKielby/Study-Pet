import { motion } from "framer-motion";
import React from "react";

type PetProps = {
  stage: "Baby" | "Teen" | "Adult";
  evolutions: number;
};

const Pet: React.FC<PetProps> = ({ stage, evolutions }) => {
  let color = stage === "Baby" ? "bg-pink-400" : stage === "Teen" ? "bg-purple-400" : "bg-blue-400";

  return (
    <motion.div
      className={`w-32 h-32 rounded-full ${color} flex items-center justify-center text-white font-bold text-xl`}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
        {evolutions}
        {"\n"}
        {stage}
    </motion.div>
  );
};

export default Pet;