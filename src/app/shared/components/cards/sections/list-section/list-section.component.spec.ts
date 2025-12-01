import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListSectionComponent } from './list-section.component';
import { ItemBuilder, SectionBuilder } from '../../../../../../testing/test-builders';
import { CardSection } from '../../../../../../models';

describe('ListSectionComponent', () => {
  let component: ListSectionComponent;
  let fixture: ComponentFixture<ListSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListSectionComponent);
    component = fixture.componentInstance;

    // Set up test section
    component.section = SectionBuilder.create()
      .withTitle('Task List')
      .withType('list')
      .withItem(ItemBuilder.create().withTitle('Task 1').withDescription('Description 1').build())
      .withItem(ItemBuilder.create().withTitle('Task 2').withDescription('Description 2').build())
      .build();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have items', () => {
    expect(component.items.length).toBe(2);
  });

  it('should track items by ID', () => {
    const item = ItemBuilder.create().withId('test-id').withTitle('Test').build();
    const trackBy = component.trackItem(0, item);
    expect(trackBy).toBe('test-id');
  });

  it('should track items by title when ID is missing', () => {
    const item = ItemBuilder.create().withTitle('Test Item').build();
    const trackBy = component.trackItem(0, item);
    expect(trackBy).toContain('Test Item');
  });

  it('should emit item interaction on click', () => {
    spyOn(component.itemInteraction, 'emit');
    const item = component.items[0];

    component.onItemClick(item);

    expect(component.itemInteraction.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        item: item,
        metadata: jasmine.objectContaining({
          sectionId: component.section.id,
          sectionTitle: component.section.title,
        }),
      })
    );
  });

  it('should handle empty section', () => {
    component.section = SectionBuilder.create().withTitle('Empty List').withType('list').build();

    fixture.detectChanges();

    expect(component.items.length).toBe(0);
  });

  it('should hide streaming placeholder in description', () => {
    const item = ItemBuilder.create().withTitle('Task').withDescription('Streaming…').build();
    component.section = SectionBuilder.create()
      .withTitle('List')
      .withType('list')
      .withItem(item)
      .build();

    fixture.detectChanges();

    expect(component.getDisplayDescription(item)).toBe('');
  });

  it('should show normal description when not streaming', () => {
    const item = ItemBuilder.create()
      .withTitle('Task')
      .withDescription('Normal description')
      .build();
    component.section = SectionBuilder.create()
      .withTitle('List')
      .withType('list')
      .withItem(item)
      .build();

    fixture.detectChanges();

    expect(component.getDisplayDescription(item)).toBe('Normal description');
  });
});
