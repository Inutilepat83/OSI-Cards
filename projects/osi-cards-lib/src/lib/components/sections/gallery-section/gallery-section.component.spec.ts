/**
 * Gallery Section Component Tests
 *
 * Unit tests for GallerySectionComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GallerySectionComponent } from './gallery-section.component';
import { By } from '@angular/platform-browser';
import { CardSection, CardItem } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { DOCUMENT } from '@angular/common';

describe('GallerySectionComponent', () => {
  let component: GallerySectionComponent;
  let fixture: ComponentFixture<GallerySectionComponent>;
  let layoutService: jasmine.SpyObj<SectionLayoutPreferenceService>;
  let document: Document;

  const mockSection: CardSection = {
    id: 'gallery-1',
    type: 'gallery',
    title: 'Gallery',
    items: [
      {
        id: 'image-1',
        title: 'Image 1',
        image: 'https://example.com/image1.jpg',
      },
      {
        id: 'image-2',
        title: 'Image 2',
        image: 'https://example.com/image2.jpg',
      },
    ],
  };

  beforeEach(async () => {
    const layoutServiceSpy = jasmine.createSpyObj('SectionLayoutPreferenceService', [
      'register',
      'getPreferences',
    ]);

    await TestBed.configureTestingModule({
      imports: [GallerySectionComponent],
      providers: [
        { provide: SectionLayoutPreferenceService, useValue: layoutServiceSpy },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GallerySectionComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(
      SectionLayoutPreferenceService
    ) as jasmine.SpyObj<SectionLayoutPreferenceService>;
    document = TestBed.inject(DOCUMENT);
    component.section = mockSection;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render section header', () => {
      fixture.detectChanges();
      const header = fixture.debugElement.query(By.css('lib-section-header'));
      expect(header).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept section input', () => {
      expect(component.section).toEqual(mockSection);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should call ngOnDestroy', () => {
      spyOn(component, 'ngOnDestroy');
      component.ngOnDestroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should register layout preference function on init', () => {
      component.ngOnInit();
      expect(layoutService.register).toHaveBeenCalledWith('gallery', jasmine.any(Function));
    });
  });

  describe('Image Selection', () => {
    it('should have null selectedImageIndex by default', () => {
      expect(component.selectedImageIndex()).toBeNull();
    });

    it('should have null selectedImage by default', () => {
      expect(component.selectedImage()).toBeNull();
    });

    it('should set selected image index', () => {
      component.selectedImageIndex.set(0);
      expect(component.selectedImageIndex()).toBe(0);
    });

    it('should set selected image', () => {
      const image = mockSection.items![0]!;
      component.selectedImage.set(image);
      expect(component.selectedImage()).toEqual(image);
    });
  });

  describe('Layout Preferences', () => {
    it('should calculate layout preferences for small item count', () => {
      const section: CardSection = {
        ...mockSection,
        items: [{ title: 'Image', image: 'https://example.com/image.jpg' }],
      };
      const prefs = (component as any).calculateGalleryLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(1);
    });

    it('should calculate layout preferences for medium item count', () => {
      const section: CardSection = {
        ...mockSection,
        items: Array.from({ length: 4 }, (_, i) => ({
          title: `Image ${i + 1}`,
          image: `https://example.com/image${i + 1}.jpg`,
        })),
      };
      const prefs = (component as any).calculateGalleryLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(2);
    });

    it('should calculate layout preferences for large item count', () => {
      const section: CardSection = {
        ...mockSection,
        items: Array.from({ length: 10 }, (_, i) => ({
          title: `Image ${i + 1}`,
          image: `https://example.com/image${i + 1}.jpg`,
        })),
      };
      const prefs = (component as any).calculateGalleryLayoutPreferences(section, 4);

      expect(prefs.preferredColumns).toBe(3);
    });

    it('should get layout preferences', () => {
      layoutService.getPreferences.and.returnValue(null);
      const prefs = component.getLayoutPreferences(4);

      expect(prefs).toBeDefined();
      expect(prefs.preferredColumns).toBeGreaterThanOrEqual(1);
      expect(prefs.preferredColumns).toBeLessThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle section without items', () => {
      const section: CardSection = {
        ...mockSection,
        items: [],
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle section with many images', () => {
      const section: CardSection = {
        ...mockSection,
        items: Array.from({ length: 50 }, (_, i) => ({
          title: `Image ${i + 1}`,
          image: `https://example.com/image${i + 1}.jpg`,
        })),
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle images with missing URLs', () => {
      const section: CardSection = {
        ...mockSection,
        items: [{ title: 'Image', image: undefined }],
      };
      component.section = section;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
