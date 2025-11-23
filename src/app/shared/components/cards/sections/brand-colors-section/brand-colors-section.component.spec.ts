import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandColorsSectionComponent } from './brand-colors-section.component';
import { SectionBuilder, FieldBuilder } from '../../../../testing/test-builders';

describe('BrandColorsSectionComponent', () => {
  let component: BrandColorsSectionComponent;
  let fixture: ComponentFixture<BrandColorsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandColorsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandColorsSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Brand Colors')
      .withType('brand-colors')
      .withField(
        FieldBuilder.create()
          .withLabel('Primary')
          .withValue('#FF7900')
          .build()
      )
      .withField(
        FieldBuilder.create()
          .withLabel('Secondary')
          .withValue('#FF9A3C')
          .build()
      )
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have fields', () => {
    expect(component.hasFields).toBe(true);
    expect(component.getFields().length).toBe(2);
  });

  it('should track fields correctly', () => {
    const field = component.getFields()[0];
    const trackBy = component.trackField(0, field);
    expect(trackBy).toBeTruthy();
  });

  it('should extract brand colors from fields', () => {
    expect(component.hasColors).toBe(true);
    expect(component.brandColors.length).toBe(2);
  });

  it('should track colors correctly', () => {
    const color = component.brandColors[0];
    const trackBy = component.trackColor(0, color);
    expect(trackBy).toBe(color.id);
  });

  it('should copy color to clipboard on click', async () => {
    if (navigator.clipboard) {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      const color = component.brandColors[0];
      
      await component.onColorClick(color);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(color.hex);
      expect(component.copiedColorId).toBe(color.id);
    }
  });
});

