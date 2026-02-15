# UI Changes - Automated Task Breakdown and Agent Orchestration

## Overview

This document describes the user interface additions for the automated task breakdown and agent orchestration features.

## New Toolbar Buttons

Three new buttons have been added to the KanbanBoard toolbar (top-right area):

### 1. Dependencies Button (Purple)
```
┌─────────────────────┐
│ 🔗 Dependencies     │
└─────────────────────┘
```
- **Color**: Purple background (`bg-purple-500`)
- **Icon**: Network icon
- **Function**: Opens dependency graph visualization
- **Location**: After sprint selector, before other buttons

### 2. Agents Button (Blue)
```
┌─────────────────────┐
│ 👥 Agents          │
└─────────────────────┘
```
- **Color**: Blue background (`bg-blue-500`)
- **Icon**: Users icon
- **Function**: Opens agent roster management panel
- **Location**: After dependencies button

### 3. Auto Breakdown Button (Gradient)
```
┌─────────────────────┐
│ ✨ Auto Breakdown  │
└─────────────────────┘
```
- **Color**: Purple to blue gradient (`from-purple-500 to-blue-500`)
- **Icon**: Sparkles icon
- **Function**: Opens automated task breakdown panel
- **Location**: After agents button, before "New Task"

## Panel Layouts

### Task Breakdown Panel

**Type**: Right-side sliding panel (50-66% width)

**Layout**:
```
┌─────────────────────────────────────────┐
│ Automated Task Breakdown            [×] │
├─────────────────────────────────────────┤
│ Input Type: [Issue] [PRD] [Screenshot]  │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Paste content here...               │ │
│ │                                     │ │
│ │ Example:                            │ │
│ │ ## Epic: User Authentication        │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Screenshot URL: [____________]           │
│                                          │
│ [✨ Generate Breakdown]                 │
│                                          │
│ Results:                                 │
│ ┌─────────────────────────────────────┐ │
│ │ ▼ Epic                      40h est │ │
│ │   ☑ Definition of Done              │ │
│ │   🧪 Test Notes                     │ │
│ │   ⚠ Risk Flags                      │ │
│ │   🎯 Acceptance Criteria            │ │
│ │                                     │ │
│ │ ▼ Ticket 1                   8h est │ │
│ │   ...                               │ │
│ │                                     │ │
│ │ ▼ Subtasks (5)                      │ │
│ │   ...                               │ │
│ │                                     │ │
│ │ 🔗 Dependencies (3)                 │ │
│ │   depends-on / blocks / related-to  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [Apply Breakdown to Board]               │
└─────────────────────────────────────────┘
```

**Features**:
- Input type selector (3 buttons)
- Large textarea with placeholder examples
- Optional screenshot URL input
- Generate button with sparkles icon
- Expandable result sections
- Apply button to create tasks

### Agent Roster Panel

**Type**: Right-side sliding panel (50-66% width)

**Layout**:
```
┌────────────┬────────────────────────────┐
│ Roster     │ Agent Details          [×] │
├────────────┼────────────────────────────┤
│ Alice (3)  │ 👤 Alice Johnson          │
│ > Bob (5) ●│ 2 active tasks • 3 slots  │
│ Carol (2)  │                            │
│            │ [Skills] [Perf] [Avail]    │
│            │                            │
│            │ Skills (5)      [+ Add]    │
│            │ ┌────────────────────────┐ │
│            │ │ React      [Expert]    │ │
│            │ │ frontend • 5 years [×] │ │
│            │ ├────────────────────────┤ │
│            │ │ Node.js    [Advanced]  │ │
│            │ │ backend • 3 years  [×] │ │
│            │ └────────────────────────┘ │
│            │                            │
│            │ Performance Tab:           │
│            │ ┌────────┬────────┐        │
│            │ │Quality │On-Time │        │
│            │ │  95%   │  90%   │        │
│            │ ├────────┼────────┤        │
│            │ │Collab  │AvgTime │        │
│            │ │  88%   │  6.5h  │        │
│            │ └────────┴────────┘        │
│            │                            │
│            │ Availability Tab:          │
│            │ Status: ● Available        │
│            │ Timezone: UTC-5            │
│            │ Hours: 09:00 - 17:00       │
│            │ Days Off: Sat, Sun         │
└────────────┴────────────────────────────┘
```

**Features**:
- Left sidebar: agent list with task counts
- Right panel: detailed agent information
- Three tabs: Skills, Performance, Availability
- Add/remove skills functionality
- Color-coded skill levels
- Performance metrics grid
- Availability configuration

### Dependency Graph Modal

**Type**: Full-screen modal with overlay

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Task Dependency Graph                   [×] │
├─────────────────────────────────────────────┤
│ Legend: ── depends-on  ── blocks  ── related│
├─────────────────────────────────────────────┤
│                                             │
│  Backlog     In Progress   Review    Done  │
│                                             │
│  ┌──────┐                  ┌──────┐        │
│  │TASK-1│─────────────────>│TASK-3│        │
│  │Login │                  │Tests │        │
│  └──────┘                  └──────┘        │
│     │                                       │
│     v                                       │
│  ┌──────┐    ┌──────┐                      │
│  │TASK-2│───>│TASK-4│                      │
│  │Signup│    │Deploy│                      │
│  └──────┘    └──────┘                      │
│                                             │
│                                   ┌───┐    │
│                                   │ + │    │
│                              100% │ − │    │
│                                   │ ⌂ │    │
│                                   └───┘    │
└─────────────────────────────────────────────┘
```

**Features**:
- Full-screen canvas
- Draggable viewport (pan)
- Mouse wheel zoom
- Zoom controls (in/out/reset)
- Zoom indicator (bottom-left)
- Color-coded edges by type
- Task nodes with ID and title
- Priority indicators on nodes
- Hover tooltips
- Column layout by status
- Legend for relationship types

## Visual Design

### Color Scheme

**Task Types**:
- Epic: Purple (`border-purple-200`, `bg-purple-50`)
- Ticket: Blue (`border-blue-200`, `bg-blue-50`)
- Subtask: Green (`border-green-200`, `bg-green-50`)

**Risk Levels**:
- Low: Blue (`bg-blue-50`, `text-blue-600`)
- Medium: Yellow (`bg-yellow-50`, `text-yellow-600`)
- High: Orange (`bg-orange-50`, `text-orange-600`)
- Critical: Red (`bg-red-50`, `text-red-600`)

**Skill Levels**:
- Beginner: Blue (`bg-blue-100`)
- Intermediate: Green (`bg-green-100`)
- Advanced: Purple (`bg-purple-100`)
- Expert: Orange (`bg-orange-100`)

**Performance Scores**:
- 90-100%: Green (`text-green-600`)
- 70-89%: Blue (`text-blue-600`)
- 50-69%: Yellow (`text-yellow-600`)
- 0-49%: Red (`text-red-600`)

**Dependency Types**:
- Depends-on: Blue (`#3b82f6`)
- Blocks: Red (`#ef4444`)
- Related-to: Gray (`#6b7280`)

### Icons

- **Sparkles** (✨): Auto breakdown
- **Users** (👥): Agent roster
- **Network** (🔗): Dependencies
- **CheckCircle** (☑): Completed DoD items
- **Circle** (○): Incomplete DoD items
- **AlertTriangle** (⚠): Risk flags
- **FlaskConical** (🧪): Test notes
- **Target** (🎯): Acceptance criteria
- **Award** (🏆): Skills tab
- **TrendingUp** (📈): Performance tab
- **Calendar** (📅): Availability tab
- **Plus** (+): Add new items
- **Trash** (🗑): Delete items
- **X** (×): Close panels

### Typography

- **Panel Titles**: `text-xl font-semibold`
- **Section Headers**: `text-sm font-medium`
- **Labels**: `text-xs font-medium`
- **Body Text**: `text-sm`
- **Metrics**: `text-3xl font-bold`

### Spacing

- **Panel Padding**: `p-6` (24px)
- **Section Spacing**: `space-y-4` (16px)
- **Item Spacing**: `space-y-2` (8px)
- **Button Gap**: `gap-3` (12px)

### Animations

- **Panel Slide**: Right-to-left entrance
- **Modal Fade**: Backdrop blur and fade
- **Button Hover**: Color darkening transition
- **Expand/Collapse**: Smooth height transition

## Responsive Design

### Desktop (>1024px)
- Panels: 50% width
- Full toolbar visible
- All features accessible

### Tablet (768-1024px)
- Panels: 66% width
- Toolbar wraps if needed
- Touch-friendly buttons

### Mobile (<768px)
- Panels: 100% width
- Stacked layout
- Simplified controls

## Accessibility

- **Keyboard Navigation**: Tab through all controls
- **Screen Readers**: Proper ARIA labels
- **Focus Indicators**: Visible focus rings
- **Color Contrast**: WCAG AA compliant
- **Button Titles**: Descriptive tooltips
- **Error Messages**: Clear and actionable

## Dark Mode Support

All components support dark mode with appropriate color schemes:
- Background: `dark:bg-gray-800`
- Text: `dark:text-gray-200`
- Borders: `dark:border-gray-700`
- Accents: Adjusted for dark backgrounds

## User Workflow

1. **Breaking Down Tasks**:
   - Click "Auto Breakdown"
   - Select input type
   - Paste content
   - Review results
   - Apply to board

2. **Managing Agents**:
   - Click "Agents"
   - Select agent
   - Switch tabs
   - Update information

3. **Viewing Dependencies**:
   - Click "Dependencies"
   - Pan and zoom
   - Hover for details
   - Close when done

All panels can be closed with:
- X button in header
- Click outside panel (for breakdown/roster)
- ESC key (future enhancement)
