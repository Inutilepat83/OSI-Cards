import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialMediaSectionComponent } from './social-media-section.component';
import { SectionBuilder, ItemBuilder } from '../../../../../../testing/test-builders';
import { CardSection } from '../../../../../../models';

describe('SocialMediaSectionComponent', () => {
  let component: SocialMediaSectionComponent;
  let fixture: ComponentFixture<SocialMediaSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialMediaSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialMediaSectionComponent);
    component = fixture.componentInstance;
    
    // Set up test section
    component.section = SectionBuilder.create()
      .withTitle('Social Media')
      .withType('social-media')
      .withItem(
        ItemBuilder.create()
          .withTitle('Post 1')
          .withDescription('First post')
          .withMeta({ platform: 'Twitter', likes: 100, comments: 20 })
          .build()
      )
      .withItem(
        ItemBuilder.create()
          .withTitle('Post 2')
          .withDescription('Second post')
          .withMeta({ network: 'LinkedIn', likes: 50 })
          .build()
      )
      .build();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have posts', () => {
    expect(component.posts.length).toBe(2);
  });

  it('should format platform from meta', () => {
    const post = component.posts[0];
    expect(component.formatPlatform(post)).toBe('Twitter');
  });

  it('should fallback to network when platform is missing', () => {
    const post = component.posts[1];
    expect(component.formatPlatform(post)).toBe('LinkedIn');
  });

  it('should fallback to "Social" when neither platform nor network exists', () => {
    const post = ItemBuilder.create()
      .withTitle('Post')
      .withMeta({})
      .build();
    expect(component.formatPlatform(post)).toBe('Social');
  });

  it('should format metric with likes and comments', () => {
    const post = component.posts[0];
    const metric = component.formatMetric(post);
    expect(metric).toContain('100 likes');
    expect(metric).toContain('20 comments');
  });

  it('should format metric with only likes', () => {
    const post = component.posts[1];
    const metric = component.formatMetric(post);
    expect(metric).toBe('50 likes');
  });

  it('should format metric with only comments', () => {
    const post = ItemBuilder.create()
      .withTitle('Post')
      .withMeta({ comments: 15 })
      .build();
    const metric = component.formatMetric(post);
    expect(metric).toBe('15 comments');
  });

  it('should return empty string when no metrics available', () => {
    const post = ItemBuilder.create()
      .withTitle('Post')
      .withMeta({})
      .build();
    expect(component.formatMetric(post)).toBe('');
  });

  it('should track posts by ID', () => {
    const post = ItemBuilder.create().withId('post-1').withTitle('Post').build();
    const trackBy = component.trackPost(0, post);
    expect(trackBy).toBe('post-1');
  });

  it('should track posts by index when ID is missing', () => {
    const post = ItemBuilder.create().withTitle('Post').build();
    const trackBy = component.trackPost(5, post);
    expect(trackBy).toBe('social-post-5');
  });

  it('should handle empty section', () => {
    component.section = SectionBuilder.create()
      .withTitle('Empty Social')
      .withType('social-media')
      .build();
    
    fixture.detectChanges();
    
    expect(component.posts.length).toBe(0);
  });
});

