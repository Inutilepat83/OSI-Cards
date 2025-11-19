import { CardDiffUtil } from './card-diff.util';
import { AICardConfig } from '../../models/card.model';

describe('CardDiffUtil hashing & equality', () => {
  it('mergeCardUpdates preserves references for identical sections', () => {
    const a: AICardConfig = {
      id: '1',
      cardTitle: 'Test',
      sections: [
        { id: 's1', title: 'S1', type: 'info', fields: [{ id: 'f1', label: 'A', value: '1' }] }
      ]
    } as any;
    // new card with same content objects but different references
    const b: AICardConfig = JSON.parse(JSON.stringify(a));
    b.id = '1';

    const { card } = CardDiffUtil.mergeCardUpdates(a, b);
    // sections reference preserved
    expect(card.sections[0]).toBe(a.sections[0]);
  });

  it('mergeCardUpdates detects structural changes when section count differs', () => {
    const a: AICardConfig = { id: '1', cardTitle: 'Test', sections: [{ id: 's1', title: 'S1', type: 'info' }] } as any;
    const b: AICardConfig = { id: '1', cardTitle: 'Test', sections: [{ id: 's1', title: 'S1', type: 'info' }, { id: 's2', title: 'S2', type: 'info' }] } as any;
    const { changeType } = CardDiffUtil.mergeCardUpdates(a, b);
    expect(changeType).toBe('structural');
  });

  it('change in fields order is detected as content change', () => {
    const a: AICardConfig = {
      id: '1',
      cardTitle: 'Test',
      sections: [
        { id: 's1', title: 'S1', type: 'info', fields: [
          { id: 'f1', label: 'A', value: '1' },
          { id: 'f2', label: 'B', value: '2' }
        ] }
      ]
    } as any;
    const b: AICardConfig = JSON.parse(JSON.stringify(a));
    b.sections![0]!.fields = [b.sections![0]!.fields![1], b.sections![0]!.fields![0]]; // swap order
    const { changeType } = CardDiffUtil.mergeCardUpdates(a, b);
    expect(changeType).toBe('content');
  });
});
