import { motion } from "framer-motion";
import React from "react";

type PetProps = {
  stage: "Baby" | "Teen" | "Adult";
  evolutions: number;
};

const Pet: React.FC<PetProps> = ({ stage }) => {
  let color = stage === "Baby" ? "bg-pink-400" : stage === "Teen" ? "bg-purple-400" : "bg-blue-400";
  const petImage = "/alien.png"; // place your image at public/pet.png

  return (
    <motion.div
      className={`w-32 h-32 rounded-full ${color} flex items-center justify-center overflow-hidden text-white font-bold text-xl`}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <img src={petImage} alt="Your pet" className="w-full h-full object-contain" />
      
    </motion.div>
  );
};

export default Pet;