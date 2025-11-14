import { useState, useCallback } from "react";
import { TiltCalculations, MousePosition } from "../types";

const MAX_LIFT_PX = 5; // slightly reduced lift for gentler tilt
const BASE_GLOW_BLUR = 20;
const MAX_GLOW_BLUR_OFFSET = 10;
const BASE_GLOW_OPACITY = 0.2;
const MAX_GLOW_OPACITY_OFFSET = 0.3;
const MAX_REFLECTION_OPACITY = 0.3;

export const useMagneticTiltCalculations = () => {
  const [tiltCalculations, setTiltCalculations] =
    useState<TiltCalculations>({
      rotateX: 0,
      rotateY: 0,
      glowBlur: BASE_GLOW_BLUR,
      glowOpacity: BASE_GLOW_OPACITY,
      reflectionOpacity: 0,
    });

  const calculateTilt = useCallback(
    (
      mousePosition: MousePosition,
      element: HTMLElement | null,
    ) => {
      if (!element) {
        setTiltCalculations({
          rotateX: 0,
          rotateY: 0,
          glowBlur: BASE_GLOW_BLUR,
          glowOpacity: BASE_GLOW_OPACITY,
          reflectionOpacity: 0,
        });
        return;
      }

      const rect = element.getBoundingClientRect();
      const halfW = rect.width / 2;
      const halfH = rect.height / 2;
      const fx = (mousePosition.x - rect.left) / rect.width;
      const fy = (mousePosition.y - rect.top) / rect.height;
      const clampedFx = Math.max(0, Math.min(1, fx));
      const clampedFy = Math.max(0, Math.min(1, fy));

      // Sinusoidal tilt: 0@0%, +1@25%, 0@50%, -1@75%, 0@100%
      const sinX = Math.sin(clampedFx * 2 * Math.PI);
      const sinY = Math.sin(clampedFy * 2 * Math.PI);

      // Dynamic max angles so vertical lift is always MAX_LIFT_PX
      const maxAngleY =
        Math.asin(MAX_LIFT_PX / halfW) * (180 / Math.PI);
      const maxAngleX =
        Math.asin(MAX_LIFT_PX / halfH) * (180 / Math.PI);

      const rotateY = sinX * maxAngleY;
      const rotateX = -sinY * maxAngleX;

      const intensity = Math.max(
        Math.abs(sinX),
        Math.abs(sinY),
      );

      const glowBlur =
        BASE_GLOW_BLUR + intensity * MAX_GLOW_BLUR_OFFSET;
      const glowOpacity =
        BASE_GLOW_OPACITY + intensity * MAX_GLOW_OPACITY_OFFSET;
      const reflectionOpacity =
        intensity * MAX_REFLECTION_OPACITY;

      setTiltCalculations({
        rotateX,
        rotateY,
        glowBlur,
        glowOpacity,
        reflectionOpacity,
      });
    },
    [],
  );

  const resetTilt = useCallback(() => {
    setTiltCalculations({
      rotateX: 0,
      rotateY: 0,
      glowBlur: BASE_GLOW_BLUR,
      glowOpacity: BASE_GLOW_OPACITY,
      reflectionOpacity: 0,
    });
  }, []);

  return { tiltCalculations, calculateTilt, resetTilt };
};