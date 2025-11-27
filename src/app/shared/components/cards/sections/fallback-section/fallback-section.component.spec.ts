import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FallbackSectionComponent } from './fallback-section.component';
import { SectionBuilder } from '../../../../testing/test-builders';

describe('FallbackSectionComponent', () => {
  let component: FallbackSectionComponent;
  let fixture: ComponentFixture<FallbackSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FallbackSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FallbackSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Unknown Section')
      .withType('unknown' as any)
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    expect(component.section.title).toBe('Unknown Section');
  });
});








