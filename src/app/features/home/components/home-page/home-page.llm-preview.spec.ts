import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { provideStore } from '@ngrx/store';
import { reducer as cardsReducer } from '../../../../store/cards/cards.state';
import { AICardConfig, CardSection } from '../../../../models';

describe('HomePageComponent LLM preview & fallback', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let component: HomePageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideStore({ cards: cardsReducer })]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('fallback parser extracts cardTitle and fields', () => {
    const input = `cardTitle: Demo\n- title: Company Overview\n type: info\n fields[2]:\n Industry, Nutrition & Health\n Founded, 1902`;
    const fallback = (component as any).createFallbackPreviewCard(input) as AICardConfig;
    expect(fallback.cardTitle).toBe('Demo');
    expect(fallback.sections.length).toBeGreaterThan(0);
    const section = fallback.sections[0];
    expect(section.title).toBe('Company Overview');
    expect(section.fields?.length).toBe(2);
    expect(section.fields?.[0].label).toBe('Industry');
    expect(section.fields?.[0].value).toContain('Nutrition');
  });

  it('fallback parser extracts list items for list sections', () => {
    const input = `cardTitle: Test\n- title: Key Contacts\n type: list\n - John Doe\n - Jane Smith`;
    const fallback = (component as any).createFallbackPreviewCard(input) as AICardConfig;
    expect(fallback.cardTitle).toBe('Test');
    const section = fallback.sections[0];
    expect(section.items?.length).toBe(2);
    expect(section.items?.[0].title).toContain('John Doe');
  });

  it('fallback parser extracts items with icon and meta', () => {
    const input = `cardTitle: Test\n- title: Key Contacts\n type: list\n - [TL] John Doe | CTO | cto@example.com`;
    const fallback = (component as any).createFallbackPreviewCard(input) as AICardConfig;
    const section = fallback.sections[0];
    expect(section.items?.length).toBe(1);
    expect(section.items?.[0].title).toContain('John Doe');
    expect((section.items?.[0] as any).icon).toBe('TL');
    expect((section.items?.[0] as any).meta.contact).toBe('cto@example.com');
  });

  it('fallback parser parses KPI percentage and numeric fields', () => {
    const input = `cardTitle: KPI Test\n- title: Analytics\n type: analytics\n fields[2]:\n Growth, 23%\n ARR, 12.5`;
    const fallback = (component as any).createFallbackPreviewCard(input) as AICardConfig;
    const section = fallback.sections[0];
    expect(section.fields?.length).toBe(2);
    const growth = section.fields?.find(f => f.label === 'Growth');
    const arr = section.fields?.find(f => f.label === 'ARR');
    expect(growth?.percentage).toBeCloseTo(23);
    expect(arr?.format).toBe('number');
    expect(arr?.value).toBeCloseTo(12.5);
  });

  it('updateLlmPreviewCard unlocks sections progressively', () => {
    // Prepare parsed card with 3 sections
    const parsed: AICardConfig = {
      cardTitle: 'Sim',
      sections: [
        { id: 's1', title: 'S1', type: 'info', fields: [{ id: 'f1', label: 'A', value: '1' }] },
        { id: 's2', title: 'S2', type: 'info', fields: [{ id: 'f2', label: 'B', value: '2' }] },
        { id: 's3', title: 'S3', type: 'info', fields: [{ id: 'f3', label: 'C', value: '3' }] }
      ]
    };
    (component as any).llmParsedCard = parsed;
    (component as any).llmPreviewCard = null;
    (component as any).llmPreviewSectionCount = 0;

    // low progress -> 1 section
    (component as any).updateLlmPreviewCard(0.10);
    expect((component as any).llmPreviewSectionCount).toBeGreaterThanOrEqual(1);
    expect((component as any).llmPreviewCard?.sections.length).toBeGreaterThanOrEqual(1);

    // higher progress -> at least 2 sections
    (component as any).updateLlmPreviewCard(0.5);
    expect((component as any).llmPreviewSectionCount).toBeGreaterThanOrEqual(2);

    // complete
    (component as any).updateLlmPreviewCard(0.99);
    expect((component as any).llmPreviewSectionCount).toBe(parsed.sections.length);
  });

  it('updateLlmPreviewCard preserves previous unchanged section references', () => {
    const parsed: AICardConfig = {
      cardTitle: 'S',
      sections: [
        { id: 's1', title: 'S1', type: 'info', fields: [{ id: 'f1', label: 'A', value: '1' }] },
        { id: 's2', title: 'S2', type: 'info', fields: [{ id: 'f2', label: 'B', value: '2' }] }
      ]
    };
    // Start with only first section shown
    (component as any).llmParsedCard = parsed;
    (component as any).llmPreviewCard = { ...parsed, sections: [parsed.sections[0]] } as any;
    (component as any).llmPreviewSectionCount = 1;

    // Update parsed with a changed second section
    const changedParsed = { ...parsed, sections: [parsed.sections[0], { ...parsed.sections[1], title: 'S2 changed' }] };
    (component as any).llmParsedCard = changedParsed;
    (component as any).updateLlmPreviewCard(0.6);
    // first section reference should be preserved (identity)
    expect((component as any).llmPreviewCard?.sections[0]).toBe(parsed.sections[0]);
    // second section should be new and have updated title
    expect((component as any).llmPreviewCard?.sections[1].title).toBe('S2 changed');
  });

  it('handles large number of sections without excessive errors', () => {
    const count = 400;
    const sections = Array.from({ length: count }, (_, i) => ({ id: `s${i}`, title: `Sec ${i}`, type: 'info', fields: [{ id: `f${i}`, label: `L${i}`, value: `${i}` }] }));
    (component as any).llmParsedCard = { cardTitle: 'Large', sections } as any;
    (component as any).llmPreviewCard = null;
    (component as any).llmPreviewSectionCount = 0;
    (component as any).updateLlmPreviewCard(1);
    expect((component as any).llmPreviewSectionCount).toBe(count);
    expect((component as any).llmPreviewCard?.sections.length).toBe(count);
  });

  it('shows Live edit badge when jsonInput is populated and not simulating', () => {
    component.jsonInput = '{"cardTitle": "Hello"}';
    (component as any).llmStreamState = { ...((component as any).llmStreamState), isSimulating: false } as any;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.ml-2');
    expect(el?.textContent).toContain('Live edit');
  });

  it('editor-driven fallback shows parsed title in preview', () => {
    component.jsonInput = '{"cardTitle": "FallbackTest", "sections": [{"title": "Overview", "type": "info", "fields": [{"label": "Industry", "value": "Tech"}]}]}';
    // ensure live preview was updated
    (component as any).processJsonInputImmediate(component.jsonInput);
    fixture.detectChanges();
    const titleEl = fixture.nativeElement.querySelector('app-ai-card-renderer h1');
    // The renderer should display fallback cardTitle
    expect(titleEl?.textContent?.trim()).toBe('FallbackTest');
  });

  it('LLM simulation updates card via editor tokens', () => {
    spyOn(component, 'onJsonInputChange').and.callThrough();
    (component as any).startLlmSimulation('{"cardTitle": "Test", "sections": [{"title": "SimSection", "type": "info", "fields": [{"label": "Industry", "value": "Tech"}]}]}');
    // Directly schedule a chunk to simulate tokens arriving
    (component as any).llmBuffer = '{"cardTitle": "Streamed Test"}';
    (component as any).processJsonInputImmediate((component as any).llmBuffer);
    fixture.detectChanges();
    const titleEl = fixture.nativeElement.querySelector('app-ai-card-renderer h1');
    expect(titleEl?.textContent?.trim()).toBe('Streamed Test');
    // Ensure the component used the editor update path
    expect((component as any).onJsonInputChange).toHaveBeenCalled();
  });

  it('re-checks and sanitizes live preview on structural changes', () => {
    const unsanitized: AICardConfig = { cardTitle: 'LP', sections: [{ title: 'Overview', fields: [{ label: 'Industry', value: 'Tech' }] }] } as any;
    // Trigger structural set
    (component as any).updateLivePreviewCard(unsanitized, 'structural');
    const live = (component as any).livePreviewCard as AICardConfig;
    expect(live.sections?.[0].id).toBeTruthy();
    expect(live.sections?.[0].fields?.[0].id).toBeTruthy();
  });

  it('re-checks structure (IDs) after a section is unlocked and at simulation finish', () => {
    const parsed: AICardConfig = {
      cardTitle: 'Unsanitized',
      sections: [
        { title: 'S1', type: 'info', fields: [{ label: 'A', value: '1' } as any] } as any,
        { title: 'S2', type: 'info', fields: [{ label: 'B', value: '2' } as any] } as any
      ]
    } as any;
    (component as any).llmParsedCard = parsed;
    (component as any).llmPreviewCard = null;
    (component as any).llmPreviewSectionCount = 0;

    // Unlock first section
    (component as any).updateLlmPreviewCard(0.1);
    expect((component as any).llmPreviewCard?.sections?.[0]?.id).toBeTruthy();
    expect((component as any).llmPreviewCard?.sections?.[0]?.fields?.[0]?.id).toBeTruthy();

    // Spying the store to ensure final dispatch contains sanitized card
    const dispatchSpy = spyOn((component as any).store, 'dispatch');
    (component as any).finishLlmSimulation();
    // Simulate the debounced final step by invoking the processing method directly
    (component as any).processJsonInput((component as any).jsonInput);
    expect(dispatchSpy).toHaveBeenCalled();
    const calledWith = dispatchSpy.calls.mostRecent().args[0] as any;
    expect(calledWith.type).toContain('generateCardSuccess');
    const finalCard = calledWith.card as AICardConfig;
    expect(finalCard.sections?.[0]?.id).toBeTruthy();
    expect(finalCard.sections?.[0]?.fields?.[0]?.id).toBeTruthy();
  });
});
