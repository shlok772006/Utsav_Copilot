import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore, INITIAL_EVENT_STATE } from './useEventStore';

describe('useEventStore', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  it('initializes with clean initial state and null plan', () => {
    const store = useEventStore.getState();
    expect(store.state).toEqual(INITIAL_EVENT_STATE);
    expect(store.plan).toBeNull();
    expect(store.history).toHaveLength(0);
  });

  it('updates state and builds plan when applyOpsAction is called', () => {
    const store = useEventStore.getState();
    store.applyOpsAction([
      { op: 'set_budget', value: 500_000 },
      { op: 'set_guest_count', value: 80 },
    ]);

    const updated = useEventStore.getState();
    expect(updated.state.totalBudget).toBe(500_000);
    expect(updated.state.guestCount).toBe(80);
    expect(updated.plan).toBeDefined();
    expect(updated.history).toHaveLength(1);
  });

  it('enforces maximum history stack cap of 20 snapshots', () => {
    const store = useEventStore.getState();

    for (let i = 1; i <= 25; i++) {
      store.applyOpsAction([{ op: 'set_guest_count', value: 50 + i }]);
    }

    const updated = useEventStore.getState();
    expect(updated.history.length).toBeLessThanOrEqual(20);
    expect(updated.history).toHaveLength(20);
  });

  it('undo restores previous state from history stack', () => {
    const store = useEventStore.getState();
    store.applyOpsAction([{ op: 'set_budget', value: 200_000 }]);
    expect(useEventStore.getState().state.totalBudget).toBe(200_000);

    store.applyOpsAction([{ op: 'set_budget', value: 400_000 }]);
    expect(useEventStore.getState().state.totalBudget).toBe(400_000);

    useEventStore.getState().undo();
    expect(useEventStore.getState().state.totalBudget).toBe(200_000);
  });

  it('loads sample event with pre-seeded anniversary parameters', () => {
    const store = useEventStore.getState();
    store.loadSampleEvent();

    const sample = useEventStore.getState();
    expect(sample.state.occasion).toBe('anniversary');
    expect(sample.state.totalBudget).toBe(300_000);
    expect(sample.state.guestCount).toBe(60);
    expect(sample.state.priorities.catering).toBe(5);
    expect(sample.plan).toBeDefined();
    expect(sample.plan?.budget.length).toBe(9);
  });
});
