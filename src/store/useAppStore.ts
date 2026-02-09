import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { Event, Member, Performance, AppState, Block } from '../types';
import { generateId } from '../utils/timeCalculation';

// Custom storage adapter for idb-keyval
const storage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

// Default blocks
const DEFAULT_BLOCKS: Block[] = [
    { id: 'block-a', name: 'ブロックA', order: 0 },
    { id: 'block-b', name: 'ブロックB', order: 1 },
    { id: 'block-c', name: 'ブロックC', order: 2 },
];

interface AppStore extends AppState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // Event actions
    createEvent: (name: string, interval: number) => string;
    updateEvent: (id: string, updates: Partial<Event>) => void;
    deleteEvent: (id: string) => void;
    setCurrentEvent: (id: string | null) => void;

    // Tab navigation
    setCurrentTab: (tab: AppState['currentTab']) => void;

    // Member actions
    addMembers: (eventId: string, names: string[]) => void;
    updateMember: (eventId: string, memberId: string, name: string) => void;
    deleteMember: (eventId: string, memberId: string) => void;

    // Performance actions
    addPerformance: (eventId: string, perf: Omit<Performance, 'id' | 'order'>) => void;
    updatePerformance: (eventId: string, perfId: string, updates: Partial<Performance>) => void;
    deletePerformance: (eventId: string, perfId: string) => void;
    reorderPerformances: (eventId: string, orderedIds: string[]) => void;

    // Block actions
    addBlock: (eventId: string) => void;
    updateBlock: (eventId: string, blockId: string, name: string) => void;
    deleteBlock: (eventId: string, blockId: string) => void;

    // Setup
    completeSetup: () => void;
    resetSetup: () => void;

    // Data export/import
    exportTeamsData: (eventId: string) => string;
    importTeamsData: (eventId: string, jsonData: string) => boolean;
    exportTimetableData: (eventId: string) => string;
    importTimetableData: (eventId: string, jsonData: string) => boolean;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            events: [],
            currentEventId: null,
            isSetupComplete: false,
            currentTab: 'teams',

            // Event actions
            createEvent: (name, interval) => {
                const id = generateId();
                const now = Date.now();
                const newEvent: Event = {
                    id,
                    name,
                    interval,
                    members: [],
                    performances: [],
                    blocks: [...DEFAULT_BLOCKS],
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({
                    events: [...state.events, newEvent],
                    currentEventId: id,
                }));
                return id;
            },

            updateEvent: (id, updates) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
                    ),
                }));
            },

            deleteEvent: (id) => {
                set((state) => ({
                    events: state.events.filter((e) => e.id !== id),
                    currentEventId: state.currentEventId === id ? null : state.currentEventId,
                }));
            },

            setCurrentEvent: (id) => {
                set({ currentEventId: id });
            },

            // Tab navigation
            setCurrentTab: (tab) => {
                set({ currentTab: tab });
            },

            // Member actions
            addMembers: (eventId, names) => {
                const newMembers: Member[] = names.map((name) => ({
                    id: generateId(),
                    name,
                }));
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? { ...e, members: [...e.members, ...newMembers], updatedAt: Date.now() }
                            : e
                    ),
                }));
            },

            updateMember: (eventId, memberId, name) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                members: e.members.map((m) => (m.id === memberId ? { ...m, name } : m)),
                                updatedAt: Date.now(),
                            }
                            : e
                    ),
                }));
            },

            deleteMember: (eventId, memberId) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                members: e.members.filter((m) => m.id !== memberId),
                                // Also remove from all performances
                                performances: e.performances.map((p) => ({
                                    ...p,
                                    memberIds: p.memberIds.filter((id) => id !== memberId),
                                })),
                                updatedAt: Date.now(),
                            }
                            : e
                    ),
                }));
            },

            // Performance actions
            addPerformance: (eventId, perf) => {
                const event = get().events.find((e) => e.id === eventId);
                const maxOrder = event?.performances.reduce((max, p) => Math.max(max, p.order), -1) ?? -1;

                const newPerf: Performance = {
                    ...perf,
                    id: generateId(),
                    order: maxOrder + 1,
                    preferredBlock: perf.preferredBlock || '',
                };

                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? { ...e, performances: [...e.performances, newPerf], updatedAt: Date.now() }
                            : e
                    ),
                }));
            },

            updatePerformance: (eventId, perfId, updates) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                performances: e.performances.map((p) =>
                                    p.id === perfId ? { ...p, ...updates } : p
                                ),
                                updatedAt: Date.now(),
                            }
                            : e
                    ),
                }));
            },

            deletePerformance: (eventId, perfId) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                performances: e.performances.filter((p) => p.id !== perfId),
                                updatedAt: Date.now(),
                            }
                            : e
                    ),
                }));
            },

            reorderPerformances: (eventId, orderedIds) => {
                set((state) => ({
                    events: state.events.map((e) => {
                        if (e.id !== eventId) return e;
                        const perfMap = new Map(e.performances.map((p) => [p.id, p]));
                        const reordered = orderedIds
                            .map((id, index) => {
                                const perf = perfMap.get(id);
                                return perf ? { ...perf, order: index } : null;
                            })
                            .filter((p): p is Performance => p !== null);
                        return { ...e, performances: reordered, updatedAt: Date.now() };
                    }),
                }));
            },

            addBlock: (eventId) => {
                const event = get().events.find((e) => e.id === eventId);
                if (!event) return;

                const nextLetter = String.fromCharCode(65 + event.blocks.length); // A, B, C...
                const newBlock: Block = {
                    id: generateId(),
                    name: `ブロック${nextLetter}`,
                    order: event.blocks.length,
                };

                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? { ...e, blocks: [...e.blocks, newBlock], updatedAt: Date.now() }
                            : e
                    ),
                }));
            },

            updateBlock: (eventId, blockId, name) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                blocks: e.blocks.map((b) => (b.id === blockId ? { ...b, name } : b)),
                                updatedAt: Date.now(),
                            }
                            : e
                    ),
                }));
            },

            deleteBlock: (eventId, blockId) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                blocks: e.blocks.filter((b) => b.id !== blockId),
                                // Clear preferredBlock for performances that had this block
                                performances: e.performances.map((p) =>
                                    p.preferredBlock === blockId ? { ...p, preferredBlock: '' } : p
                                ),
                                updatedAt: Date.now(),
                            }
                            : e
                    ),
                }));
            },

            // Setup
            completeSetup: () => {
                set({ isSetupComplete: true, currentTab: 'timetable' });
            },

            resetSetup: () => {
                set({ isSetupComplete: false, currentTab: 'teams' });
            },

            // Data export/import
            exportTeamsData: (eventId) => {
                const event = get().events.find((e) => e.id === eventId);
                if (!event) return '';

                const data = {
                    members: event.members,
                    performances: event.performances.filter(p => p.type === 'team'),
                    blocks: event.blocks,
                };
                return JSON.stringify(data, null, 2);
            },

            importTeamsData: (eventId, jsonData) => {
                try {
                    const data = JSON.parse(jsonData);
                    const event = get().events.find((e) => e.id === eventId);
                    if (!event || !data) return false;

                    set((state) => ({
                        events: state.events.map((e) =>
                            e.id === eventId
                                ? {
                                    ...e,
                                    members: data.members || e.members,
                                    performances: data.performances || e.performances,
                                    blocks: data.blocks || e.blocks,
                                    updatedAt: Date.now(),
                                }
                                : e
                        ),
                    }));
                    return true;
                } catch {
                    return false;
                }
            },

            exportTimetableData: (eventId) => {
                const event = get().events.find((e) => e.id === eventId);
                if (!event) return '';

                const data = {
                    name: event.name,
                    interval: event.interval,
                    members: event.members,
                    performances: event.performances,
                    blocks: event.blocks,
                };
                return JSON.stringify(data, null, 2);
            },

            importTimetableData: (eventId, jsonData) => {
                try {
                    const data = JSON.parse(jsonData);
                    if (!data) return false;

                    set((state) => ({
                        events: state.events.map((e) =>
                            e.id === eventId
                                ? {
                                    ...e,
                                    ...data,
                                    id: e.id, // Keep original ID
                                    updatedAt: Date.now(),
                                }
                                : e
                        ),
                    }));
                    return true;
                } catch {
                    return false;
                }
            },
        }),
        {
            name: 'stageflow_v2_db', // Changed name to force migration/fresh start
            storage: createJSONStorage(() => storage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// Selector hooks
export const useCurrentEvent = () => {
    const { events, currentEventId, _hasHydrated } = useAppStore();
    // Return null while loading
    if (!_hasHydrated) return null;
    return events.find((e) => e.id === currentEventId) || null;
};
