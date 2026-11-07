import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * CharacterV1: 3D perspective scroll transform (rotation and translation)
 */
export const CharacterV1 = ({
  char,
  index,
  centerIndex,
  scrollYProgress,
  className = "",
}) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 40, 0]
  );
  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 35, 0]
  );
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0.2, 1]);

  return (
    <motion.span
      className={`inline-block ${isSpace ? "w-3" : ""} ${className}`}
      style={{
        x,
        rotateX,
        opacity,
      }}
    >
      {char}
    </motion.span>
  );
};

/**
 * CharacterV2: Scale and vertical offset scroll transform
 */
export const CharacterV2 = ({
  char,
  index,
  centerIndex,
  scrollYProgress,
  className = "",
}) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 40, 0]
  );
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const y = useTransform(
    scrollYProgress,
    [0, 0.5],
    [Math.abs(distanceFromCenter) * 30, 0]
  );
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0.25, 1]);

  return (
    <motion.span
      className={`inline-block ${isSpace ? "w-3" : ""} ${className}`}
      style={{
        x,
        scale,
        y,
        opacity,
        transformOrigin: "center",
      }}
    >
      {char}
    </motion.span>
  );
};

/**
 * CharacterV3: Rotation and vertical curve scroll transform
 */
export const CharacterV3 = ({
  char,
  index,
  centerIndex,
  scrollYProgress,
  className = "",
}) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 60, 0]
  );
  const rotate = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 30, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [0, 0.5],
    [-Math.abs(distanceFromCenter) * 15, 0]
  );
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0.25, 1]);

  return (
    <motion.span
      className={`inline-block ${isSpace ? "w-3" : ""} ${className}`}
      style={{
        x,
        rotate,
        y,
        scale,
        opacity,
        transformOrigin: "center",
      }}
    >
      {char}
    </motion.span>
  );
};

/**
 * Skiper31: Scroll-driven character animation component
 * From @skiper-ui/skiper31
 */
export default function Skiper31({
  text = "SUPREME COURT ARCHITECTURE",
  variant = "v1",
  className = "",
  containerClassName = "",
}) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const characters = text.split("");
  const centerIndex = Math.floor(characters.length / 2);

  const renderChar = (char, index) => {
    switch (variant) {
      case "v2":
        return (
          <CharacterV2
            key={index}
            char={char}
            index={index}
            centerIndex={centerIndex}
            scrollYProgress={scrollYProgress}
            className={className}
          />
        );
      case "v3":
        return (
          <CharacterV3
            key={index}
            char={char}
            index={index}
            centerIndex={centerIndex}
            scrollYProgress={scrollYProgress}
            className={className}
          />
        );
      case "v1":
      default:
        return (
          <CharacterV1
            key={index}
            char={char}
            index={index}
            centerIndex={centerIndex}
            scrollYProgress={scrollYProgress}
            className={className}
          />
        );
    }
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${containerClassName}`}>
      <div
        className="flex items-center justify-center flex-wrap"
        style={{ perspective: "600px" }}
      >
        {characters.map(renderChar)}
      </div>
    </div>
  );
}
