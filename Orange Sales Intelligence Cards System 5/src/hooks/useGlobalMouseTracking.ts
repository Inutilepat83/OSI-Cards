import { useState, useEffect, useCallback, useRef } from 'react';
import { MousePosition } from '../types';

interface UseGlobalMouseTrackingProps {
  elementRef: React.RefObject<HTMLElement>;
  magneticRange?: number;
  throttleMs?: number;
}

export const useGlobalMouseTracking = ({
  elementRef,
  magneticRange = 300,
  throttleMs = 16
}: UseGlobalMouseTrackingProps) => {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [relativeMousePos, setRelativeMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isInMagneticField, setIsInMagneticField] = useState(false);
  const [magneticIntensity, setMagneticIntensity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const lastUpdateTime = useRef(0);

  const calculateMagneticIntensity = useCallback((distance: number): number => {
    if (distance >= magneticRange) return 0;
    const t = distance / magneticRange;
    return 1 - t * t;
  }, [magneticRange]);

  const updateMousePosition = useCallback((clientX: number, clientY: number) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < throttleMs) return;
    lastUpdateTime.current = now;

    const newMousePos = { x: clientX, y: clientY };
    setMousePos(newMousePos);

    const el = elementRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top  + rect.height / 2;

    // Direct follow, no smoothing
    const dx = newMousePos.x - centerX;
    const dy = newMousePos.y - centerY;
    const distance = Math.hypot(dx, dy);

    setRelativeMousePos({ x: newMousePos.x - rect.left, y: newMousePos.y - rect.top });

    const intensity = calculateMagneticIntensity(distance);
    setMagneticIntensity(intensity);
    setIsInMagneticField(intensity > 0);
  }, [elementRef, throttleMs, calculateMagneticIntensity]);

  const handleMouseMove = useCallback((e: MouseEvent) => updateMousePosition(e.clientX, e.clientY), [updateMousePosition]);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsInMagneticField(false);
    setMagneticIntensity(0);
    setRelativeMousePos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return { mousePos, relativeMousePos, isInMagneticField, magneticIntensity, isHovered, handleMouseEnter, handleMouseLeave };
};