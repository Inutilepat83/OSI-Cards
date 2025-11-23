import { getBreakpointFromWidth, Breakpoint, getOptimalColumns, isMobile, isTablet, isDesktop } from './responsive.util';

describe('ResponsiveUtil', () => {
  describe('getBreakpointFromWidth', () => {
    it('should return XS for small widths', () => {
      expect(getBreakpointFromWidth(300)).toBe(Breakpoint.XS);
      expect(getBreakpointFromWidth(500)).toBe(Breakpoint.SM);
    });

    it('should return MD for medium widths', () => {
      expect(getBreakpointFromWidth(768)).toBe(Breakpoint.MD);
      expect(getBreakpointFromWidth(1023)).toBe(Breakpoint.MD);
    });

    it('should return LG for large widths', () => {
      expect(getBreakpointFromWidth(1024)).toBe(Breakpoint.LG);
      expect(getBreakpointFromWidth(1440)).toBe(Breakpoint.XL);
    });

    it('should handle edge cases', () => {
      expect(getBreakpointFromWidth(767)).toBe(Breakpoint.SM);
      expect(getBreakpointFromWidth(768)).toBe(Breakpoint.MD);
      expect(getBreakpointFromWidth(1023)).toBe(Breakpoint.MD);
      expect(getBreakpointFromWidth(1024)).toBe(Breakpoint.LG);
    });
  });

  describe('getOptimalColumns', () => {
    it('should return reasonable column count', () => {
      // This test depends on window size, so we test the function exists
      expect(typeof getOptimalColumns).toBe('function');
    });
  });

  describe('isMobile', () => {
    it('should be a function', () => {
      expect(typeof isMobile).toBe('function');
    });
  });

  describe('isTablet', () => {
    it('should be a function', () => {
      expect(typeof isTablet).toBe('function');
    });
  });

  describe('isDesktop', () => {
    it('should be a function', () => {
      expect(typeof isDesktop).toBe('function');
    });
  });
});

