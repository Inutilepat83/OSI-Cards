import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextReferenceSectionComponent } from './text-reference-section.component';
import { SectionBuilder } from '../../../../testing/test-builders';

describe('TextReferenceSectionComponent', () => {
  let component: TextReferenceSectionComponent;
  let fixture: ComponentFixture<TextReferenceSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextReferenceSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TextReferenceSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Reference')
      .withType('text-reference')
      .withDescription('This is a reference text')
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have description', () => {
    expect(component.section.description).toBe('This is a reference text');
  });
});








