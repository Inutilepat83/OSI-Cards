import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionRendererComponent } from './section-renderer.component';
import { SectionBuilder } from '../../../../testing/test-builders';

describe('SectionRendererComponent', () => {
  let component: SectionRendererComponent;
  let fixture: ComponentFixture<SectionRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionRendererComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SectionRendererComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Test Section')
      .withType('info')
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve section type correctly', () => {
    const infoSection = SectionBuilder.create()
      .withTitle('Info')
      .withType('info')
      .build();
    
    component.section = infoSection;
    fixture.detectChanges();
    
    expect(component.resolvedType).toBe('info');
  });

  it('should handle analytics section type', () => {
    const analyticsSection = SectionBuilder.create()
      .withTitle('Analytics')
      .withType('analytics')
      .build();
    
    component.section = analyticsSection;
    fixture.detectChanges();
    
    expect(component.resolvedType).toBe('analytics');
  });

  it('should emit section event', () => {
    spyOn(component.sectionEvent, 'emit');
    
    const event = {
      type: 'fieldInteraction',
      field: { id: 'test', label: 'Test', value: 'Value' },
      metadata: {}
    };
    
    component.onSectionEvent(event);
    
    expect(component.sectionEvent.emit).toHaveBeenCalledWith(event);
  });
});







