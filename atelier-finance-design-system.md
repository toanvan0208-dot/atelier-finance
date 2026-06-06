---
name: Atelier Finance
description: Design system for a quiet macro-learning workspace, aligned with the provided Macro Thesis interface.

visual_direction:
  mood: quiet, structured, educational, research-focused
  density: medium-low
  style: minimal finance workspace
  avoid: trading-terminal energy, saturated market colors, heavy shadows, decorative gradients

colors:
  page: '#f7f9fb'
  shell: '#fbfcfd'
  surface: '#ffffff'
  surface-soft: '#f4f6f8'
  surface-muted: '#eef1f4'
  surface-hover: '#f1f3f5'

  text: '#111827'
  text-muted: '#4b5563'
  text-subtle: '#6b7280'
  text-faint: '#9ca3af'

  border: '#d7dce2'
  border-soft: '#e5e7eb'
  border-strong: '#c4cad2'

  primary: '#111827'
  primary-hover: '#030712'
  on-primary: '#ffffff'

  accent: '#4f46e5'
  accent-soft: '#eef0ff'
  accent-muted: '#c7d2fe'
  accent-ink: '#3730a3'

  data-neutral: '#111827'
  data-positive-soft: '#eefdf8'
  data-caution-soft: '#fff7ed'
  data-risk-soft: '#fff1f2'

  error: '#b91c1c'
  error-soft: '#fee2e2'

typography:
  brand:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: '0'
  page-title:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.35'
    letterSpacing: '0'
  section-title:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0'
  body:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.65'
    letterSpacing: '0'
  body-small:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.55'
    letterSpacing: '0'
  label:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '0.04em'
  metric:
    fontFamily: JetBrains Mono
    fontSize: 34px
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: '0'
  metric-small:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: '0'

radius:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  pill: 9999px

spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  page-y: 56px
  content-gap: 32px

layout:
  topbar-height: 48px
  sidebar-width: 240px
  assistant-width: 360px
  lesson-width: 560px
  card-width: 560px
  mobile-bottom-tab-height: 64px

breakpoints:
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px

states:
  focus-ring: '#4f46e5'
  hover-bg: '#f1f3f5'
  active-bg: '#eef0ff'
  disabled-bg: '#eef1f4'
  disabled-text: '#9ca3af'
---

# Atelier Finance Design System

## Style Target

The interface should look like a quiet financial learning workspace, close to the Macro Thesis screen in the reference image. It is not a trading app and should not feel like a market dashboard. The page is calm, sparse, and instructional, with small typography, thin borders, pale gray surfaces, and a restrained indigo accent.

The design language is built around three ideas:

- Study first: users are learning macro concepts, not making urgent trades.
- Structure first: every module sits inside a predictable shell with sidebar, topbar, lesson content, and assistant panel.
- Restraint first: color is used for orientation and selection, not decoration.

## Visual Principles

Use a mostly monochrome palette. The main page background is a very light gray, the reading surface is white, and containers are separated by 1px borders instead of shadows.

Use indigo only for active navigation, small icons, focus states, selected tabs, and compact status badges. Avoid large indigo panels or saturated decorative blocks.

Keep the interface compact. The screenshot uses small labels, narrow content cards, and generous whitespace around the central lesson column. Do not scale headings too large.

Avoid heavy elevation. Most UI should feel flat and paper-like. Floating elements such as tooltips or assistant suggestions may use a very soft shadow, but cards should normally rely on borders.

## Page Shell

The desktop shell has three zones:

- Left sidebar: journey navigation, 240px wide.
- Center lesson area: narrow reading column, around 560px wide.
- Right assistant panel: learning guidance and chat, around 360px wide.

The topbar is 48px high and spans the full page. It contains the Macro Thesis brand on the left, a centered system title, and compact utility icons on the right.

The center lesson area should be visually calm and vertically spaced. Use `page-y` spacing above the content. Keep paragraphs under roughly 70 characters per line.

On tablet, hide or collapse the assistant panel first. On mobile, hide the sidebar and replace it with a bottom tab bar.

## Navigation

Sidebar items are compact rows with a small monochrome icon and 12px to 13px text.

Active navigation uses:

- `surface-hover` background
- a thin indigo left accent
- primary text
- no large filled pill

Inactive items should remain low contrast. Avoid oversized icons, badges, or colored rows.

The bottom mobile navigation uses 3 to 5 tabs, each with a small icon and short Vietnamese label.

## Typography

Use Be Vietnam Pro only for brand text and page-level titles when a Vietnamese-friendly tone is needed. Use Inter for most interface text.

The reference screen is intentionally small and quiet. Recommended sizes:

- Brand: 13px
- Topbar title: 12px
- Lesson title: 18px
- Section title: 13px
- Body: 13px
- Card tabs: 11px to 12px
- Labels: 10px uppercase
- Main metrics: 34px, JetBrains Mono

Line height should be generous for body text, but compact for labels and navigation.

Do not use negative letter spacing. Do not use hero-scale type in this product UI.

## Cards

Cards are white surfaces with 1px borders and 8px to 10px radius. Default cards do not have shadows.

Card headers use a very pale gray background and a bottom border. The header includes:

- Small icon badge
- Section label, such as `A. Tăng trưởng kinh tế`
- Compact status chip on the right

Card body spacing should be moderate, not roomy. The reference layout feels like a study worksheet, not a marketing card.

Cards must not be nested inside other decorative cards. If content needs grouping inside a card, use a subtle panel with `surface-soft`, border, and 8px radius.

## Status Chips

Status chips in this style are quiet and mostly indigo-tinted:

- Background: `accent-soft`
- Text: `accent-ink`
- Border: optional `accent-muted`
- Radius: pill
- Font size: 10px
- Uppercase or short title case

Use labels like `PHỤC HỒI`, `KIỂM SOÁT`, `DẦN NỚI LỎNG`, `CẦN THEO DÕI`.

Only use stronger caution/risk colors when the state is genuinely critical. The default learning flow should stay calm.

## Macro Thinking Map

The Thinking Map is a large white canvas with 1px border, 8px to 10px radius, and minimal internal decoration.

Use a very subtle 24px dot grid only if it does not add visual noise. In a dense lesson page, the canvas may remain plain white like the reference image.

Nodes are small rounded rectangles with:

- White fill
- 1px neutral border
- 6px to 8px radius
- 10px to 12px text
- centered text

The central node may use slightly stronger text or a faint indigo outline. Connectors are thin gray lines. Avoid colorful node fills.

## Data Cards

Each data card follows this structure:

1. Header with icon, title, and status chip.
2. Horizontal tabs with one active tab.
3. Centered guiding question in italic text.
4. Two-column body: metrics on the left, interpretation panel on the right.

Metrics use JetBrains Mono for numbers. The main metric is large and black. Secondary metrics are smaller and grouped in a 2-column mini grid.

The interpretation panel uses `surface-soft`, 1px `border-soft`, 8px radius, and compact bullet points. Keep bullets short.

Tabs should be low contrast. The active tab uses primary text or indigo text and a subtle bottom border.

## Quiz Pattern

Quiz cards follow the same card structure as data cards.

Answers are full-width bordered rows:

- 44px minimum height
- 8px radius
- white background
- neutral border
- small circular radio indicator

Selected answers use a faint indigo background and indigo border. Do not use bright success colors before submission.

The submit button is the strongest element in the quiz area. Use a black or near-black button with white text, matching the screenshot.

## Assistant Panel

The assistant panel is a right-side learning companion, not a chatbot centerpiece.

Use a white or near-white panel with a left border. The assistant header has a small indigo icon, title, and short description.

Messages are compact cards. Guidance messages use a thin indigo left border. User notes use neutral gray. Assistant explanations may use the same indigo system unless a real error or warning is involved.

The input composer sits at the bottom with:

- 1px border
- 8px radius
- white fill
- small placeholder text
- compact send button

## Buttons

Primary action:

- Background: `primary`
- Text: `on-primary`
- Radius: 6px to 8px
- Height: 40px to 44px
- No gradient

Secondary action:

- White or transparent fill
- Neutral or indigo border
- Primary or indigo text

Ghost action:

- Transparent fill
- Hover background `surface-hover`
- Used for utility icons and low-priority controls

All buttons need hover, active, focus, disabled, and loading states.

## Forms

Inputs are quiet and compact:

- White fill
- 1px neutral border
- 8px radius
- 40px to 44px height
- 12px to 13px text

Focus uses an indigo ring. Error uses red text and a clear message, not color alone.

## Empty, Loading, And Error States

Loading states use skeleton blocks that match the final layout. Avoid large spinners.

Empty states should be simple: one short title, one short explanation, and one useful action.

Error states should be plain-language and local to the failing module. Do not show technical stack traces in the UI.

If financial data may be stale, show a small last-updated timestamp near the data source.

## Accessibility

All controls must be keyboard reachable.

Focus states must be visible.

Text contrast should meet WCAG AA.

Touch targets on mobile should be at least 44px by 44px.

Do not rely on color alone to explain state. Pair color with text labels.

## Module Consistency Rules

Every module should reuse the same shell structure:

1. Topbar
2. Sidebar or mobile bottom tabs
3. Center content column
4. Optional assistant panel
5. Shared cards, tabs, chips, forms, quiz rows, and action cards

Module pages should not invent new card styles or new navigation styles. If a module needs a special surface, it should still use the same border, radius, typography, and accent rules.

## CSS Token Mapping

```css
:root {
  --color-page: #f7f9fb;
  --color-shell: #fbfcfd;
  --color-surface: #ffffff;
  --color-surface-soft: #f4f6f8;
  --color-surface-muted: #eef1f4;
  --color-surface-hover: #f1f3f5;

  --color-text: #111827;
  --color-text-muted: #4b5563;
  --color-text-subtle: #6b7280;
  --color-text-faint: #9ca3af;

  --color-border: #d7dce2;
  --color-border-soft: #e5e7eb;
  --color-border-strong: #c4cad2;

  --color-primary: #111827;
  --color-primary-hover: #030712;
  --color-accent: #4f46e5;
  --color-accent-soft: #eef0ff;
  --color-accent-muted: #c7d2fe;
  --color-accent-ink: #3730a3;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-pill: 9999px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;

  --topbar-height: 48px;
  --sidebar-width: 240px;
  --assistant-width: 360px;
  --lesson-width: 560px;
}
```

## Implementation Checklist

- Use a 3-zone desktop shell: sidebar, lesson column, assistant panel.
- Keep the topbar 48px high and visually light.
- Keep the lesson column narrow, around 560px.
- Use white cards with 1px borders and 8px to 10px radius.
- Use pale gray card headers and subtle tab dividers.
- Use indigo only for active/focus/small status moments.
- Use near-black primary buttons for submission.
- Keep text sizes compact and readable.
- Use JetBrains Mono only for metrics and data values.
- Provide loading, empty, error, focus, hover, active, disabled, and mobile states.
- On mobile, replace sidebar with bottom tabs and hide the assistant panel by default.
