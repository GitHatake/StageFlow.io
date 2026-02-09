// StageFlow - Type Definitions

export interface Member {
  id: string;
  name: string;
}

export interface Performance {
  id: string;
  type: 'team' | 'break';
  title: string;
  duration: number; // minutes (default: 5)
  memberIds: string[]; // empty for breaks (unless explicitly assigned)
  order: number;
  preferredBlock: string; // 'A', 'B', 'C', ... or '' for unspecified
}

export interface Block {
  id: string;
  name: string; // 'ブロックA', 'ブロックB', etc.
  order: number;
}

export interface Event {
  id: string;
  name: string;
  interval: number; // minimum rest time in minutes (5, 10, or 15)
  members: Member[];
  performances: Performance[];
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface Warning {
  performanceId: string;
  memberId: string;
  memberName: string;
  gap: number; // actual gap (negative means insufficient)
}

export interface AppState {
  events: Event[];
  currentEventId: string | null;
  isSetupComplete: boolean;
  currentTab: 'teams' | 'timetable' | 'members'; // active tab
}

// Computed types
export interface PerformanceWithTime extends Performance {
  startTime: number; // minutes from start
  endTime: number;   // minutes from start
  warnings: Warning[];
}

// Member timeline view
export interface MemberTimeline {
  memberId: string;
  memberName: string;
  appearances: {
    performanceId: string;
    performanceTitle: string;
    startTime: number;
    endTime: number;
    restBefore: number; // rest time before this appearance
  }[];
  totalAppearances: number;
}
