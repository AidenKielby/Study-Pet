import { motion } from "framer-motion";
import React from "react";

type PetProps = {
  stage: "Baby" | "Teen" | "Adult";
  evolutions: number;
  petChoice: number;
  petEvolution: number;
};

const Pet: React.FC<PetProps> = ({ petChoice, petEvolution }) => {
  // Cap evolution at the last available sprite per pet choice to avoid broken paths.
  const maxEvolutionByPet: Record<number, number> = {
    1: 2,
    2: 4,
  };
  const safeEvolution = Math.min(petEvolution, maxEvolutionByPet[petChoice] ?? 2);
  const petImage = "/Pet" + petChoice + "." + safeEvolution + ".png";

  return (
    <motion.div
      className="pet-shell"
      key={petImage} /* force remount when the image path changes so the new sprite loads */
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <img src={petImage} alt="Your pet" className="pet-avatar" />
      
    </motion.div>
  );
};

export default Pet;
