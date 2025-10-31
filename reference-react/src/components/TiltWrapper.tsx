import React, { useEffect, RefObject } from 'react';
import { useMagneticTiltCalculations } from '../hooks/useMagneticTiltCalculations';
import { MousePosition } from '../types';
// CSS styles are now in globals.css

interface TiltWrapperProps {
  children: React.ReactNode;
  mousePosition: MousePosition;
  cardRef: RefObject<HTMLElement>;
  isActive: boolean;
  className?: string;
}

export const TiltWrapper: React.FC<TiltWrapperProps> = ({ children, mousePosition, cardRef, isActive, className = '' }) => {
  const { tiltCalculations, calculateTilt, resetTilt } = useMagneticTiltCalculations();

  useEffect(() => {
    if (isActive && cardRef.current) calculateTilt(mousePosition, cardRef.current);
    else resetTilt();
  }, [mousePosition, isActive, calculateTilt, resetTilt]); // Remove cardRef from dependencies

  const style = {
    '--tilt-x': `${tiltCalculations.rotateX}deg`,
    '--tilt-y': `${tiltCalculations.rotateY}deg`,
    '--glow-blur': `${tiltCalculations.glowBlur}px`,
    '--glow-color': `rgba(255,121,0,${tiltCalculations.glowOpacity})`,
    '--reflection-opacity': tiltCalculations.reflectionOpacity
  } as React.CSSProperties;

  return (
    <div ref={cardRef} className={`tilt-container glow-container ${className}`} style={style}>
      {children}
    </div>
  );
};