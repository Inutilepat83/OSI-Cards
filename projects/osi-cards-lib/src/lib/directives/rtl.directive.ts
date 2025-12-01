/**
 * RTL (Right-to-Left) Support Directive (Improvement #64)
 * 
 * Provides automatic RTL layout support for OSI Cards.
 * Handles bidirectional text, mirroring, and locale-aware styling.
 * 
 * @example
 * ```html
 * <osi-card [osiRtl]="isRtl">
 *   <osi-section>Content</osi-section>
 * </osi-card>
 * 
 * <!-- Auto-detect from document -->
 * <osi-card osiRtlAuto>
 *   <osi-section>Content</osi-section>
 * </osi-card>
 * ```
 */

import {
  Directive,
  Input,
  ElementRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Renderer2,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  effect
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Text direction type
 */
export type TextDirection = 'ltr' | 'rtl' | 'auto';

/**
 * RTL-aware position type
 */
export type LogicalPosition = 'start' | 'end' | 'inline-start' | 'inline-end';

/**
 * RTL configuration options
 */
export interface RtlConfig {
  /** Direction mode */
  direction: TextDirection;
  /** Mirror icons */
  mirrorIcons?: boolean;
  /** Mirror animations */
  mirrorAnimations?: boolean;
  /** Force direction (ignore inherited) */
  force?: boolean;
}

// ============================================================================
// RTL UTILITY SERVICE
// ============================================================================

/**
 * RTL utility functions
 */
export class RtlUtil {
  /**
   * Get the document's text direction
   */
  static getDocumentDirection(doc: Document): TextDirection {
    const htmlDir = doc.documentElement.getAttribute('dir');
    const bodyDir = doc.body?.getAttribute('dir');
    const computedDir = getComputedStyle(doc.documentElement).direction;
    
    return (htmlDir || bodyDir || computedDir || 'ltr') as TextDirection;
  }
  
  /**
   * Check if a locale typically uses RTL
   */
  static isRtlLocale(locale: string): boolean {
    const rtlLocales = [
      'ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ku',
      'ar-SA', 'ar-EG', 'ar-MA', 'ar-DZ', 'ar-TN', 'ar-LY',
      'ar-JO', 'ar-LB', 'ar-SY', 'ar-IQ', 'ar-KW', 'ar-AE',
      'ar-QA', 'ar-BH', 'ar-OM', 'ar-YE',
      'he-IL', 'fa-IR', 'ur-PK', 'ur-IN'
    ];
    
    const normalizedLocale = locale.toLowerCase();
    return rtlLocales.some(rtl => 
      normalizedLocale === rtl || normalizedLocale.startsWith(rtl + '-')
    );
  }
  
  /**
   * Convert physical property to logical
   */
  static toLogical(
    property: 'left' | 'right' | 'margin-left' | 'margin-right' | 'padding-left' | 'padding-right',
    isRtl: boolean
  ): string {
    const physicalToLogical: Record<string, { ltr: string; rtl: string }> = {
      'left': { ltr: 'inline-start', rtl: 'inline-end' },
      'right': { ltr: 'inline-end', rtl: 'inline-start' },
      'margin-left': { ltr: 'margin-inline-start', rtl: 'margin-inline-end' },
      'margin-right': { ltr: 'margin-inline-end', rtl: 'margin-inline-start' },
      'padding-left': { ltr: 'padding-inline-start', rtl: 'padding-inline-end' },
      'padding-right': { ltr: 'padding-inline-end', rtl: 'padding-inline-start' }
    };
    
    const mapping = physicalToLogical[property];
    return mapping ? (isRtl ? mapping.rtl : mapping.ltr) : property;
  }
  
  /**
   * Get transform value for icon mirroring
   */
  static getMirrorTransform(isRtl: boolean): string {
    return isRtl ? 'scaleX(-1)' : 'none';
  }
  
  /**
   * Convert animation direction for RTL
   */
  static getAnimationDirection(animation: string, isRtl: boolean): string {
    if (!isRtl) return animation;
    
    // Map animations that need reversal
    const animationMappings: Record<string, string> = {
      'slideInLeft': 'slideInRight',
      'slideInRight': 'slideInLeft',
      'slideOutLeft': 'slideOutRight',
      'slideOutRight': 'slideOutLeft',
      'fadeInLeft': 'fadeInRight',
      'fadeInRight': 'fadeInLeft'
    };
    
    return animationMappings[animation] || animation;
  }
}

// ============================================================================
// RTL DIRECTIVE
// ============================================================================

@Directive({
  selector: '[osiRtl]',
  standalone: true,
  exportAs: 'osiRtl',
  host: {
    '[attr.dir]': 'effectiveDirection()',
    '[class.osi-rtl]': 'isRtl()',
    '[class.osi-ltr]': '!isRtl()'
  }
})
export class OsiRtlDirective implements OnInit, OnChanges, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  
  /**
   * Enable/disable RTL mode
   */
  @Input('osiRtl') rtl: boolean | '' = false;
  
  /**
   * Force RTL regardless of document direction
   */
  @Input() force = false;
  
  /**
   * Mirror icons in RTL mode
   */
  @Input() mirrorIcons = true;
  
  /**
   * Mirror animations in RTL mode
   */
  @Input() mirrorAnimations = true;
  
  // Signals for reactive state
  private readonly _isRtl = signal(false);
  private readonly _documentDirection = signal<TextDirection>('ltr');
  
  /**
   * Whether RTL mode is active
   */
  readonly isRtl = this._isRtl.asReadonly();
  
  /**
   * Effective text direction
   */
  readonly effectiveDirection = computed<TextDirection>(() => 
    this._isRtl() ? 'rtl' : 'ltr'
  );
  
  private mutationObserver: MutationObserver | null = null;
  
  constructor() {
    // React to RTL changes
    effect(() => {
      const isRtl = this._isRtl();
      this.applyRtlStyles(isRtl);
    });
  }
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectDocumentDirection();
      this.observeDocumentDirection();
    }
    this.updateRtlState();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rtl'] || changes['force']) {
      this.updateRtlState();
    }
  }
  
  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }
  
  /**
   * Update the RTL state based on inputs
   */
  private updateRtlState(): void {
    // Empty string means directive was applied without value (truthy)
    const rtlEnabled = this.rtl === '' || this.rtl === true;
    
    if (this.force) {
      this._isRtl.set(rtlEnabled);
    } else {
      // Combine with document direction
      const docDir = this._documentDirection();
      this._isRtl.set(rtlEnabled || docDir === 'rtl');
    }
  }
  
  /**
   * Detect the document's text direction
   */
  private detectDocumentDirection(): void {
    const dir = RtlUtil.getDocumentDirection(this.document);
    this._documentDirection.set(dir);
  }
  
  /**
   * Observe document direction changes
   */
  private observeDocumentDirection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'dir') {
          this.detectDocumentDirection();
          this.updateRtlState();
        }
      }
    });
    
    // Observe both html and body elements
    this.mutationObserver.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['dir']
    });
    
    if (this.document.body) {
      this.mutationObserver.observe(this.document.body, {
        attributes: true,
        attributeFilter: ['dir']
      });
    }
  }
  
  /**
   * Apply RTL-specific styles
   */
  private applyRtlStyles(isRtl: boolean): void {
    const element = this.el.nativeElement as HTMLElement;
    
    // Apply CSS custom properties for RTL-aware styling
    this.renderer.setStyle(
      element,
      '--osi-rtl-direction',
      isRtl ? '-1' : '1'
    );
    
    this.renderer.setStyle(
      element,
      '--osi-rtl-text-align',
      isRtl ? 'right' : 'left'
    );
    
    if (this.mirrorIcons) {
      this.renderer.setStyle(
        element,
        '--osi-rtl-icon-transform',
        RtlUtil.getMirrorTransform(isRtl)
      );
    }
  }
  
  /**
   * Get logical position based on direction
   */
  getLogicalStart(): 'left' | 'right' {
    return this._isRtl() ? 'right' : 'left';
  }
  
  /**
   * Get logical end position based on direction
   */
  getLogicalEnd(): 'left' | 'right' {
    return this._isRtl() ? 'left' : 'right';
  }
}

// ============================================================================
// RTL AUTO-DETECT DIRECTIVE
// ============================================================================

@Directive({
  selector: '[osiRtlAuto]',
  standalone: true,
  exportAs: 'osiRtlAuto',
  host: {
    '[attr.dir]': 'direction()',
    '[class.osi-rtl]': 'isRtl()',
    '[class.osi-ltr]': '!isRtl()'
  }
})
export class OsiRtlAutoDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  
  /**
   * Locale to detect direction from
   */
  @Input() locale?: string;
  
  private readonly _direction = signal<TextDirection>('ltr');
  
  /**
   * Current text direction
   */
  readonly direction = this._direction.asReadonly();
  
  /**
   * Whether RTL mode is active
   */
  readonly isRtl = computed(() => this._direction() === 'rtl');
  
  private mutationObserver: MutationObserver | null = null;
  
  ngOnInit(): void {
    this.detectDirection();
    
    if (isPlatformBrowser(this.platformId)) {
      this.observeDocumentChanges();
    }
  }
  
  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }
  
  /**
   * Detect text direction
   */
  private detectDirection(): void {
    let direction: TextDirection = 'ltr';
    
    // Priority 1: Explicit locale
    if (this.locale) {
      direction = RtlUtil.isRtlLocale(this.locale) ? 'rtl' : 'ltr';
    }
    // Priority 2: Document lang attribute
    else if (isPlatformBrowser(this.platformId)) {
      const lang = this.document.documentElement.lang || 
                   navigator.language ||
                   (navigator as any).userLanguage;
      
      if (lang && RtlUtil.isRtlLocale(lang)) {
        direction = 'rtl';
      } else {
        // Priority 3: Document dir attribute
        direction = RtlUtil.getDocumentDirection(this.document);
      }
    }
    
    this._direction.set(direction);
    this.applyDirection(direction);
  }
  
  /**
   * Observe document changes that might affect direction
   */
  private observeDocumentChanges(): void {
    this.mutationObserver = new MutationObserver(() => {
      this.detectDirection();
    });
    
    this.mutationObserver.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'lang']
    });
  }
  
  /**
   * Apply direction to element
   */
  private applyDirection(direction: TextDirection): void {
    const element = this.el.nativeElement as HTMLElement;
    
    this.renderer.setStyle(
      element,
      '--osi-rtl-direction',
      direction === 'rtl' ? '-1' : '1'
    );
  }
}

// ============================================================================
// RTL CONTENT DIRECTIVE
// ============================================================================

@Directive({
  selector: '[osiRtlContent]',
  standalone: true
})
export class OsiRtlContentDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  
  /**
   * Content that may need RTL handling
   */
  @Input('osiRtlContent') content?: string;
  
  /**
   * Whether content contains RTL characters
   */
  @Input() detectRtl = true;
  
  ngOnInit(): void {
    if (this.detectRtl && this.content) {
      const hasRtl = this.containsRtlCharacters(this.content);
      if (hasRtl) {
        this.renderer.setAttribute(
          this.el.nativeElement,
          'dir',
          'auto'
        );
      }
    }
  }
  
  /**
   * Check if string contains RTL characters
   */
  private containsRtlCharacters(text: string): boolean {
    // Unicode ranges for RTL scripts
    const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRegex.test(text);
  }
}

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

/**
 * CSS custom properties for RTL support
 * Apply these to your stylesheet:
 * 
 * ```css
 * .osi-card {
 *   text-align: var(--osi-rtl-text-align, left);
 * }
 * 
 * .osi-icon-mirror {
 *   transform: var(--osi-rtl-icon-transform, none);
 * }
 * 
 * .osi-directional {
 *   transform: scaleX(var(--osi-rtl-direction, 1));
 * }
 * 
 * // Use logical properties for automatic RTL
 * .osi-section {
 *   padding-inline-start: 1rem;
 *   padding-inline-end: 1rem;
 *   margin-inline-start: 0;
 *   margin-inline-end: auto;
 * }
 * ```
 */
export const RTL_CSS_PROPERTIES = `
:host {
  --osi-rtl-direction: 1;
  --osi-rtl-text-align: left;
  --osi-rtl-icon-transform: none;
}

:host(.osi-rtl) {
  --osi-rtl-direction: -1;
  --osi-rtl-text-align: right;
}

:host(.osi-rtl) .osi-icon-directional {
  transform: var(--osi-rtl-icon-transform, scaleX(-1));
}
`;

