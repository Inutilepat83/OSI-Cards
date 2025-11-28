import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventSectionComponent } from './event-section.component';
import { SectionBuilder, ItemBuilder } from '../../../../testing/test-builders';

describe('EventSectionComponent', () => {
  let component: EventSectionComponent;
  let fixture: ComponentFixture<EventSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EventSectionComponent);
    component = fixture.componentInstance;
    
    component.section = SectionBuilder.create()
      .withTitle('Timeline')
      .withType('event')
      .withItem(
        ItemBuilder.create()
          .withTitle('Event 1')
          .withDescription('Description 1')
          .withDate('2024-01-01')
          .build()
      )
      .withItem(
        ItemBuilder.create()
          .withTitle('Event 2')
          .withDescription('Description 2')
          .withDate('2024-02-01')
          .build()
      )
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have items', () => {
    expect(component.hasItems).toBe(true);
    expect(component.getItems().length).toBe(2);
  });

  it('should track items correctly', () => {
    const item = component.getItems()[0];
    const trackBy = component.trackItem(0, item);
    expect(trackBy).toBeTruthy();
  });

  it('should emit item interaction on click', () => {
    spyOn(component.itemInteraction, 'emit');
    const item = component.getItems()[0];
    
    component.onItemClick(item);
    
    expect(component.itemInteraction.emit).toHaveBeenCalled();
  });
});









