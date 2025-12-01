import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsSectionComponent } from './news-section.component';
import { SectionBuilder, ItemBuilder } from '../../../../../../testing/test-builders';
import { CardSection } from '../../../../../../models';

describe('NewsSectionComponent', () => {
  let component: NewsSectionComponent;
  let fixture: ComponentFixture<NewsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NewsSectionComponent);
    component = fixture.componentInstance;
    
    // Set up test section
    component.section = SectionBuilder.create()
      .withTitle('Latest News')
      .withType('news')
      .withItem(
        ItemBuilder.create()
          .withTitle('News Article 1')
          .withDescription('Article description')
          .withMeta({ source: 'Tech News', publishedAt: '2024-01-15' })
          .build()
      )
      .withItem(
        ItemBuilder.create()
          .withTitle('News Article 2')
          .withDescription('Another article')
          .withMeta({ publisher: 'Business Daily', time: '2024-01-14' })
          .build()
      )
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have news items', () => {
    expect(component.newsItems.length).toBe(2);
  });

  it('should format source from meta', () => {
    const item = component.newsItems[0];
    expect(component.formatSource(item)).toBe('Tech News');
  });

  it('should fallback to publisher when source is missing', () => {
    const item = component.newsItems[1];
    expect(component.formatSource(item)).toBe('Business Daily');
  });

  it('should fallback to "News" when neither source nor publisher exists', () => {
    const item = ItemBuilder.create()
      .withTitle('Article')
      .withMeta({})
      .build();
    expect(component.formatSource(item)).toBe('News');
  });

  it('should format timestamp from publishedAt', () => {
    const item = component.newsItems[0];
    expect(component.formatTimestamp(item)).toBe('2024-01-15');
  });

  it('should format timestamp from time field', () => {
    const item = component.newsItems[1];
    expect(component.formatTimestamp(item)).toBe('2024-01-14');
  });

  it('should format timestamp from date field', () => {
    const item = ItemBuilder.create()
      .withTitle('Article')
      .withMeta({ date: '2024-01-13' })
      .build();
    expect(component.formatTimestamp(item)).toBe('2024-01-13');
  });

  it('should return empty string when no timestamp available', () => {
    const item = ItemBuilder.create()
      .withTitle('Article')
      .withMeta({})
      .build();
    expect(component.formatTimestamp(item)).toBe('');
  });

  it('should track items by ID', () => {
    const item = ItemBuilder.create().withId('news-1').withTitle('News').build();
    const trackBy = component.trackItem(0, item);
    expect(trackBy).toBe('news-1');
  });

  it('should track items with source when ID is missing', () => {
    const item = ItemBuilder.create()
      .withTitle('News')
      .withMeta({ source: 'Tech News' })
      .build();
    const trackBy = component.trackItem(0, item);
    expect(trackBy).toContain('news-item');
    expect(trackBy).toContain('Tech News');
  });

  it('should hide streaming placeholder in description', () => {
    const item = ItemBuilder.create()
      .withTitle('News')
      .withDescription('Streaming…')
      .build();
    expect(component.getDisplayDescription(item)).toBe('');
  });

  it('should show normal description when not streaming', () => {
    const item = ItemBuilder.create()
      .withTitle('News')
      .withDescription('Normal description')
      .build();
    expect(component.getDisplayDescription(item)).toBe('Normal description');
  });
});











