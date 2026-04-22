# Polaris — Frontend Design System

This document is the single source of truth for all visual and interaction patterns in the Polaris Next.js frontend. Reference it before building any new component.

---

## Table of Contents

1. [Fonts](#1-fonts)
2. [Color Palette](#2-color-palette)
3. [Border Radius](#3-border-radius)
4. [Spacing](#4-spacing)
5. [Typography Scale](#5-typography-scale)
6. [Shadows](#6-shadows)
7. [Component Patterns](#7-component-patterns)
   - [Buttons](#buttons)
   - [Cards](#cards)
   - [Forms](#forms)
   - [Tabs & Filters](#tabs--filters)
   - [Badges & Pills](#badges--pills)
   - [Modals](#modals)
   - [Tables](#tables)
   - [Empty States](#empty-states)
   - [Loading States](#loading-states)
   - [Step Indicator](#step-indicator)
   - [Toggle Switch](#toggle-switch)
   - [Custom Checkbox & Radio](#custom-checkbox--radio)
   - [Carousel & Dots](#carousel--dots)
8. [Interactive States](#8-interactive-states)
9. [Layout Patterns](#9-layout-patterns)
10. [Surface Contexts](#10-surface-contexts)
11. [Shared Reusable Patterns](#11-shared-reusable-patterns)
12. [Third-Party Dependencies](#12-third-party-dependencies)

---

## 1. Fonts

Two fonts are loaded via `next/font/local` in `src/app/fonts.ts` and applied globally on `<body>`.

### Gellix — Primary / Body Font
- CSS variable: `--font-gellix`
- Weights loaded: 400 (Light), 500 (Regular), 700 (Medium)
- Applied via: `gellix.variable gellix.className antialiased` on `<body>`
- Mapped in `globals.css` as: `--font-family-sans: var(--font-gellix), ui-sans-serif, system-ui`
- **Use for**: all body copy, labels, buttons, UI text

### The Seasons — Display / Headline Font
- CSS variable: `--font-seasons`
- Weight loaded: 300 (Light)
- Tailwind utility: `font-family-seasons`
- Mapped in `globals.css` as: `--font-family-seasons: 'Seasons', ui-serif, Georgia`
- **Use for**: hero headlines, section titles, marketing copy only
- Example: `font-family-seasons font-light text-[48px] leading-12 tracking-[-3%]`

> **Rule**: Never use Seasons for UI chrome (buttons, labels, forms). It is decorative only.

---

## 2. Color Palette

### Brand Primary — Fuchsia

The single brand colour. Apply it to all primary actions, active states, and key highlights. It is used as a direct Tailwind class (`fuchsia-600`), not a CSS variable.

| Token | Class | Hex approx. | Usage |
|---|---|---|---|
| Primary | `fuchsia-600` | `#c026d3` | CTA buttons, active tabs, step circles, time slot selected, "Book Now" |
| Primary hover | `fuchsia-700` | `#a21caf` | Hover state on all fuchsia-600 elements |
| Primary light | `fuchsia-50` | `#fdf4ff` | Selected item backgrounds, hover backgrounds |
| Primary subtle | `fuchsia-100` | `#fae8ff` | Avatar backgrounds, pill fills, secondary badges |
| Primary border | `fuchsia-200` | `#f0abfc` | Borders on selected items, subtle dividers |
| Primary border strong | `fuchsia-500` | `#d946ef` | Selected package border (2px), active input focus |
| Primary text | `fuchsia-600` | `#c026d3` | Prices, links, active labels |
| Primary text subtle | `fuchsia-400` | `#e879f9` | Secondary icon accents |
| Brand overlay | CTA section bg | `bg-fuchsia-700` | CTA section background |

### Neutrals (Gray Scale)

| Class | Usage |
|---|---|
| `white` | Page backgrounds, cards, modals, inputs |
| `gray-50` | Page background (admin), form field fills, hover backgrounds |
| `gray-100` | Admin tab container, skeleton loaders, secondary hover fills |
| `gray-200` | Borders, dividers, inactive connectors |
| `gray-300` | Inactive step circles, placeholder icons, subtle borders |
| `gray-400` | Hint / helper text |
| `gray-500` | Secondary / descriptive text, inactive tabs |
| `gray-600` | Body text (moderate emphasis) |
| `gray-700` | Form labels, medium-emphasis headings |
| `gray-900` | Primary headings, high-contrast text |

### Status Colors

| Status | Background | Text | Border | Usage |
|---|---|---|---|---|
| Confirmed | `bg-lime-50` | `text-lime-800` | `border-lime-800` | Booking CONFIRMED |
| Confirmed (table) | `bg-lime-50` | `text-lime-700` | — | Table status badge |
| Pending | `bg-gray-100` | `text-[#E17100]` | `border-[#E17100]` | Booking / payment PENDING |
| Pending (card) | `bg-orange-50` | `text-orange-700` | `border-orange-700` | Card view |
| Cancelled | `bg-red-50` | `text-[#D10505]` | `border-[#D10505]` | Booking CANCELLED |
| Paid | `bg-emerald-50` | `text-emerald-800` | `border-emerald-800` | Payment PAID |
| Partial | `bg-sky-50` | `text-sky-700` | `border-sky-700` | Payment PARTIAL |
| Failed | `bg-rose-50` | `text-rose-700` | `border-rose-700` | Payment FAILED |
| Completed | `bg-lime-50` | `text-lime-800` | `border-lime-800` | Booking COMPLETED |
| Error | `bg-red-50` | `text-red-500` | `border-red-100` | Inline form errors |
| Success/Savings | `bg-green-500` | `text-white` | — | Savings badges |

### Accent — Pink
Used sparingly for soft backgrounds and selected states alongside fuchsia.

| Class | Usage |
|---|---|
| `bg-pink-50` | Booking summary box background, selected payment option |
| `border-pink-100` | Dividers inside booking summary |
| `hover:bg-pink-50/30` | Hover on available services in picker |

---

## 3. Border Radius

The app uses a consistent radius ladder. Choose the right level for the component's visual weight.

| Class | px equiv. | Use for |
|---|---|---|
| `rounded-full` | 9999px | Buttons (all CTAs), category pills/tabs, badges, step circles, toggle thumbs, duration badges, carousel dots |
| `rounded-3xl` | ~24px | Large image cards (service cards, hero), staff cards, empty state dashed borders, confirmation containers, package grid cards |
| `rounded-2xl` | ~20px | Calendar container, payment option buttons, booking summary box, promo active state box, package card (customer grid) |
| `rounded-xl` | ~14px | Form inputs (all customer-facing), selected item rows, no-service placeholders, toggle container, password display box, error message boxes |
| `rounded-lg` | ~10px | Admin tab switcher items, sidebar nav items, admin dropdown items, calendar day cells, filter/table containers |
| `rounded-md` | ~8px | shadcn/ui `Button` default (override with `rounded-full` for branded buttons) |

> **Rule for customer-facing components**: default to `rounded-full` for interactive elements and `rounded-3xl` / `rounded-2xl` for containers. `rounded-xl` for inputs. Never use `rounded-md` on customer-facing buttons.

> **Rule for admin components**: use `rounded-xl` for inputs, `rounded-lg` for tab items and containers, `rounded-full` for icon buttons and avatars.

---

## 4. Spacing

### Page-Level Padding

| Context | Classes |
|---|---|
| Admin page shell | `p-6 bg-gray-50 min-h-screen` |
| Customer services page | `px-4 py-6 space-y-6` |
| Customer home section | `px-4 py-16 space-y-12` |
| CTA section | `py-16 px-5` |
| Booking step content | `space-y-6` |

### Component Internal Padding

| Component | Padding |
|---|---|
| Customer service card content | `p-6` |
| Admin service card content | `p-4 space-y-3` |
| Staff card content | `p-5 space-y-3` |
| Package card content | `p-5 space-y-3` |
| Booking card (admin list) | `p-3` |
| Booking table panel | `p-6 rounded-lg border border-gray-200` |
| Payment option button | `p-5 rounded-2xl` |
| Booking summary box | `p-3 space-y-6` |
| Selected package display | `p-4 rounded-xl` |
| Promo success box | `p-3 rounded-xl` |
| Calendar container | `p-4` |
| Form active/toggle row | `py-2 px-4 rounded-xl` |

### Gap Scale (most-used)

| Value | Usage |
|---|---|
| `gap-1` | Service pill rows (tight) |
| `gap-1.5` | Icon + text pairs, dot indicators |
| `gap-2` | Standard icon + label |
| `gap-3` | Form fields, button rows, primary card rows |
| `gap-4` | Grid gaps (services, packages), form grid columns |
| `gap-5` | Staff grid |
| `gap-6` | Hero content areas |

### `space-y-*` Scale

| Value | Usage |
|---|---|
| `space-y-1` | Label + helper text pairs |
| `space-y-1.5` | Form field internals (label + input + hint) |
| `space-y-2` | Standard form fields |
| `space-y-3` | Card content sections |
| `space-y-4` | Form sections, booking content blocks |
| `space-y-5` | Promo code form |
| `space-y-6` | Page-level and step-level sections |

### Touch Target Heights

| Context | Height |
|---|---|
| Customer primary / back nav buttons | `h-14` |
| Customer details inputs | `h-14` |
| Staff modal inputs | `h-12` |
| Admin action buttons (table row) | `h-8` |
| Dropdown trigger (icon button) | `h-8 w-8` or `h-10 w-10` |

---

## 5. Typography Scale

### Size Scale

| Class | Usage |
|---|---|
| `text-[10px]` | Micro labels: booking card status badges, service pills inside packages |
| `text-[11px]` | Category badge, deposit badge on admin service card |
| `text-xs` | Helper text, step labels, policy copy, card dates, promo code details |
| `text-sm` | Standard body copy, form labels, button labels, meta info |
| `text-[16px]` | Booking card time, admin page sub-descriptions |
| `text-base` | Step navigation button labels |
| `text-lg` | Card titles, section titles, confirmation amounts |
| `text-xl` | Section headings (`font-semibold`), booking form section titles |
| `text-2xl` | Step headings (`font-semibold`) |
| `text-3xl` | Booking wizard title (`font-bold`) |
| `text-[36px]` | CTA section heading (Seasons) |
| `text-[48px]` | Home page hero label (Seasons, `leading-12 tracking-[-3%]`) |
| `text-5xl` | Hero `h1` (Seasons) |

### Weight Usage

| Weight | Class | Usage |
|---|---|---|
| Light | `font-light` | Seasons display headings only |
| Normal | `font-normal` | Calendar cells, form placeholders |
| Medium | `font-medium` | Labels, badge text, tabs, nav items |
| Semibold | `font-semibold` | Card titles, section headings, step headings |
| Bold | `font-bold` | Prices, form page titles, totals, table column headers |
| Mono bold | `font-mono font-bold tracking-widest` | Temp password display only |

### Special Text Modifiers

| Modifier | Usage |
|---|---|
| `line-clamp-2` | Service card description |
| `line-clamp-1` | Package description in booking step |
| `truncate` | Service names in compact lists |
| `uppercase` | Promo code input field |
| `tracking-[-3%]` | Seasons display headlines only |
| `tracking-widest` | Temp password mono code |
| `antialiased` | Global body — do not remove |

---

## 6. Shadows

| Class | Usage |
|---|---|
| `shadow-lg` | Customer service card (default) |
| `shadow-md` | Admin card **on hover** (`hover:shadow-md`) |
| `shadow-sm` | Active admin tab pill |
| `shadow-none` | Admin card default (no shadow until hover) |
| `shadow` | Toggle thumb |

> **Rule**: Customer-facing cards always carry `shadow-lg` at rest. Admin cards have no shadow at rest, gaining `shadow-md` on hover. Never apply `shadow-lg` to admin components.

---

## 7. Component Patterns

### Buttons

#### Primary CTA (Customer-facing)
```
py-2.5 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 rounded-full transition-colors text-white text-sm
```
Always paired with `ArrowRight` icon and `flex gap-2 items-center`.

#### Step Navigation Pair (Booking wizard)
```jsx
// Back
<Button variant="outline" className="flex-1 h-14 rounded-full text-base font-medium border-gray-200">
  Back
</Button>
// Continue
<Button className="flex-1 h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium">
  Continue
</Button>
```
Always in `flex gap-3 pt-6`.

#### Admin Destructive Button
```
bg-[#D10505] hover:bg-[#D10505]/90 text-white rounded-full
```

#### Admin Assign / Action (Table)
```
// Assign stylist
bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-full h-8
// Cash payment
bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-full h-8
// Charge (Paystack)
bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-100 rounded-full h-8
```

#### Icon Button (Dropdown trigger)
```
h-8 w-8 rounded-full hover:bg-muted    // admin card
h-10 w-10 rounded-full hover:bg-muted  // admin booking card
```

---

### Cards

#### Customer Service Card
```
relative w-full h-125 rounded-3xl overflow-hidden shadow-lg group
```
- Full-bleed `<Image fill>` with `object-cover transition-transform duration-500 group-hover:scale-110`
- Gradient overlay: `absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent`
- Top-right badge: `absolute top-4 right-4 z-10` with `bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5`
- Content: `absolute inset-x-0 bottom-0 p-6 text-white`

#### Admin Service Card
```
Card: rounded-3xl border shadow-none p-0 overflow-hidden hover:shadow-md transition-shadow duration-200
Image strip: h-40
CardContent: p-4 space-y-3
Category badge: text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full
Deposit badge: text-[11px] bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full
Footer: border-t border-gray-100 pt-2 flex justify-between
```

#### Staff Card
```
Card: rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200
Avatar: w-11 h-11 rounded-full bg-fuchsia-100 flex items-center justify-center
Role badge: text-[10px] font-semibold bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full
Footer: border-t border-gray-100 pt-1 space-y-1.5
```

---

### Forms

#### Field Anatomy
```
// Label
<label className="text-sm font-medium text-gray-700">
  Field Name <span className="text-red-500">*</span>
</label>

// Input (customer-facing)
<Input className="rounded-xl bg-gray-50 border-gray-200 h-14" />

// Input (admin / modal)
<Input className="rounded-xl h-12 bg-white border-[#E2E8F0] shadow-none" />

// Hint text
<p className="text-xs text-gray-400">Helpful note</p>

// Inline error
<p className="text-sm text-red-500">Error message</p>

// Error banner
<p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
  Error message
</p>
```

#### Form Layout
```
// Standard form
<form className="space-y-4 py-2">
  <div className="space-y-1.5"> {/* each field group */}

// Two-column row
<div className="grid grid-cols-2 gap-4">

// Submit + Cancel pair
<div className="flex gap-3 pt-2">
  <Button variant="outline" className="flex-1 rounded-full">Cancel</Button>
  <Button className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 rounded-full">Save</Button>
</div>
```

---

### Tabs & Filters

#### Admin Tab Switcher (Services / Packages toggle style)
```jsx
<div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
  <button className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
  }`}>
    Tab Label
  </button>
</div>
```
Use for 2–4 tabs max. For many categories, use the scrollable pill strip below.

#### Scrollable Category Pill Strip (Customer-facing)
```jsx
<div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
  <button className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
    active ? "bg-fuchsia-600 text-white" : "text-gray-500 hover:text-gray-900"
  }`}>
    All
  </button>
  {/* one per category */}
</div>
```

#### Scrollable Category Pill Strip (Admin)
```jsx
<div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide max-w-full">
  <button className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
  }`}>
    All
  </button>
</div>
```

#### Booking Wizard Category Tabs (compact)
```jsx
// Same as customer pill strip but smaller:
px-3 py-1.5 text-xs font-medium
```

---

### Badges & Pills

| Type | Classes |
|---|---|
| Category / status pill (small) | `px-2 py-0.5 rounded-full text-[11px] font-medium bg-{color}-100 text-{color}-700` |
| Status badge (table) | `px-2 py-1 rounded-full text-xs font-medium` |
| Status badge (card, with border) | `px-2 py-0.5 rounded-full text-[10px] font-medium border` |
| Duration badge (on image) | `bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium` |
| Savings badge | `bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full` |
| Service pill inside package | `text-[11px] bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 px-2 py-0.5 rounded-full` |
| Hero / home label pill | `text-fuchsia-700 bg-fuchsia-50 py-1 px-2 rounded-full text-sm font-medium` |

---

### Modals

Use the shared `<Modal>` component. Size via `childrenClassName`:

| Use case | `childrenClassName` |
|---|---|
| Confirmation (delete, sign out) | `max-h-[224px] w-[500px]` |
| Edit service / create form | `max-h-120` |
| Add stylist | `max-h-[420px]` |

#### Confirmation Modal Body
```jsx
// Destructive confirmation
<div className="flex justify-end gap-3 pt-4">
  <Button variant="outline">Cancel</Button>
  <Button className="bg-[#D10505] hover:bg-[#D10505]/90 text-white rounded-full">Delete</Button>
</div>
```

---

### Tables

```
// Outer wrapper
<div className="space-y-4">

// Panel (filter or table)
<div className="max-h-165 overflow-y-auto rounded-lg border border-gray-200 p-6 space-y-4">
```
- Uses `<DataTable>` shared component
- Status badges inside table: `px-2 py-1 rounded-full text-xs font-medium`
- Action buttons in rows: `h-8` compact size, colour-coded (see Button patterns)

---

### Empty States

#### Dashed placeholder (inline)
```jsx
<div className="p-6 text-center rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
  No items selected yet.
</div>
```

#### Full-page empty (admin page)
```jsx
<div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
  <SomeIcon className="w-12 h-12 text-gray-300 mb-4" />
  <p className="text-gray-500 text-lg font-semibold">Nothing here yet</p>
  <p className="text-gray-400 text-sm">Descriptive hint</p>
</div>
```

#### Search no-results (customer)
```jsx
<div className="py-20 text-center text-gray-500">
  No services match your search
</div>
```

---

### Loading States

#### Inline spinner
```jsx
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600" />
```

#### Full-overlay (covers a card/container)
```jsx
<div className="absolute inset-x-0 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
  <Loader2 className="w-10 h-10 animate-spin text-fuchsia-600" />
  <p className="text-sm text-gray-500 mt-2">Loading...</p>
</div>
```

#### Skeleton (grid placeholder)
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {[...Array(6)].map((_, i) => (
    <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
  ))}
</div>
```

---

### Step Indicator

```jsx
// Circle
<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
  isActive || isCompleted ? "bg-fuchsia-600 text-white" : "bg-gray-300 text-gray-600"
}`}>
  {stepNumber}
</div>

// Connector line
<div className={`flex-1 h-0.5 ${isCompleted ? "bg-fuchsia-600" : "bg-gray-300"}`} />

// Label
<span className={`text-xs font-medium ${
  isCurrent ? "text-fuchsia-600" : "text-gray-500"
}`}>
  Step Name
</span>
```

---

### Toggle Switch

```jsx
<button
  onClick={() => setValue(!value)}
  className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-fuchsia-600" : "bg-gray-200"}`}
>
  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
    value ? "translate-x-6" : "translate-x-1"
  }`} />
</button>
```

---

### Custom Checkbox & Radio

#### Checkbox (Terms acceptance)
```jsx
<input type="checkbox" className="sr-only peer" />
<div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:border-fuchsia-600 peer-checked:bg-fuchsia-600 transition-colors flex items-center justify-center">
  <svg className="w-3 h-3 text-white" ...checkmark path />
</div>
```

#### Radio Button (Payment selection)
```jsx
// Outer ring
<div className={`w-5 h-5 rounded-full border-2 ${selected ? "border-fuchsia-600" : "border-gray-300"}`}>
  {/* Inner fill when selected */}
  {selected && <div className="w-3 h-3 rounded-full bg-fuchsia-600 m-auto" />}
</div>
```

---

### Carousel & Dots

#### Indicator dots
```jsx
<div className="flex justify-center gap-1.5 mt-4">
  {items.map((_, i) => (
    <button
      key={i}
      className={`h-1.5 rounded-full transition-all ${
        i === activeIndex ? "w-6 bg-fuchsia-600" : "w-1.5 bg-gray-300"
      }`}
    />
  ))}
</div>
```

#### Hero slideshow dots (larger)
```jsx
// Active: w-5 h-2 bg-white
// Inactive: w-2 h-2 bg-white/40 hover:bg-white/60
```

---

## 8. Interactive States

### Hover Rules

| Element | Hover class |
|---|---|
| Image cards | `group-hover:scale-110 transition-transform duration-500` (on `<Image>`) |
| Admin cards | `hover:shadow-md transition-shadow duration-200` |
| Primary buttons | `hover:bg-fuchsia-700` |
| Destructive buttons | `hover:bg-[#D10505]/90` |
| Sidebar nav items | `hover:bg-gray-100 transition-colors` |
| Sign out nav item | `hover:text-red-500 hover:bg-gray-100` |
| Inactive category tab (customer) | `hover:text-gray-900` |
| Inactive admin tab | `hover:text-gray-700` |
| Package rows | `hover:border-fuchsia-300 hover:bg-fuchsia-50/20 cursor-pointer transition-colors` |
| Available service rows | `hover:border-fuchsia-200 hover:bg-pink-50/30 cursor-pointer transition-colors` |
| Available time slots | `hover:bg-fuchsia-300` |
| Calendar day | `hover:bg-gray-100` |

### Disabled States

```
disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
```
Applied to: nav Continue/Submit buttons, unavailable time slots, form submit when invalid.

### Selected / Active States

| Element | Selected class |
|---|---|
| Category tab (customer) | `bg-fuchsia-600 text-white` |
| Category tab (admin) | `bg-white shadow-sm text-gray-900` |
| Time slot | `bg-fuchsia-500 hover:bg-fuchsia-600 text-white` |
| Payment option | `border-fuchsia-600 bg-pink-50` |
| Package | `border-2 border-fuchsia-500 bg-fuchsia-50/40` |
| Step indicator | `bg-fuchsia-600 text-white` |
| Calendar day | `!bg-fuchsia-600 !text-white !rounded-lg` |
| Calendar today | `text-fuchsia-500` |
| Discount type button | `border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700` |

### Transitions

| Context | Class |
|---|---|
| All colour changes | `transition-colors` |
| Sidebar expand/collapse | `transition-all duration-300` |
| Service card image zoom | `transition-transform duration-500` |
| Card shadow on hover | `transition-shadow duration-200` |
| Hero slideshow crossfade | `transition-opacity duration-1000 ease-in-out` |
| Carousel dot width | `transition-all` |

---

## 9. Layout Patterns

### Grid Layouts

```
// Service / package / staff grids
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4   // services + packages
grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5   // staff
grid grid-cols-2 gap-4                                  // two-column form rows
grid grid-cols-3 gap-2                                  // time slot grid
```

### Section Divider with Label

```jsx
<div className="flex items-center gap-4">
  <div className="h-px flex-1 bg-gray-200" />
  <span className="text-sm text-gray-400 font-medium">Section Label</span>
  <div className="h-px flex-1 bg-gray-200" />
</div>
```
Used to separate packages from individual services.

### Lighter Dashed Separator
```jsx
<div className="flex items-center gap-3 text-xs text-gray-400">
  <div className="h-px flex-1 bg-gray-100" />
  <span>or choose individual services</span>
  <div className="h-px flex-1 bg-gray-100" />
</div>
```

### Admin Shell
```
// Outer: flex h-screen overflow-hidden
// Sidebar: hidden md:flex flex-col h-screen border-r bg-white w-60 (expanded) / w-20 (collapsed)
// Main area: flex-1 overflow-auto
```

### Customer Shell
```
flex flex-col min-h-screen bg-white
```

---

## 10. Surface Contexts

The app has two distinct visual contexts. Never mix their patterns.

### Customer-Facing
- Background: `bg-white`
- Primary action colour: `fuchsia-600`
- Buttons: always `rounded-full`
- Cards: `rounded-3xl shadow-lg` with dark image overlays
- Inputs: `rounded-xl h-14 bg-gray-50`
- Typography: Gellix body, Seasons for display headlines only
- Empty states: centered text, no border
- Tabs: fuchsia active pill, plain text inactive

### Admin-Facing
- Background: `bg-gray-50`
- Primary action colour: `fuchsia-600` (same), but used more sparingly
- Buttons: mix of `rounded-full` (action) and `rounded-lg` (tab items)
- Cards: `rounded-3xl border shadow-none` → `hover:shadow-md`
- Inputs: `rounded-xl h-12 bg-white border-[#E2E8F0] shadow-none`
- Tabs: `bg-gray-100 rounded-xl p-1` container, `bg-white shadow-sm rounded-lg` active
- Tables: `rounded-lg border border-gray-200 p-6`
- Empty states: dashed border container `rounded-3xl`

---

## 11. Shared Reusable Patterns

### "Book Now" Button (always the same)
```jsx
<Link href={...} className="py-2.5 px-4 bg-fuchsia-600 flex gap-2 items-center justify-center hover:bg-fuchsia-700 rounded-full transition-colors text-white text-sm">
  <ArrowRight className="h-4 w-4" />
  <span>Book Now</span>
</Link>
```

### Price Display
```jsx
// Total / prominent
<p className="font-bold text-fuchsia-600 text-xl">GHS {amount.toFixed(2)}</p>

// Inline (card / list)
<span className="font-medium text-fuchsia-600">GHS {amount.toFixed(2)}</span>

// Strikethrough original price
<p className="text-xs text-gray-400 line-through">GHS {original.toFixed(2)}</p>
```

### Icon + Text Label
```jsx
<div className="flex items-center gap-2">
  <SomeIcon className="w-4 h-4 text-fuchsia-600" />
  <span className="text-sm font-medium text-gray-700">Label</span>
</div>
```

### Page Heading (Admin)
```jsx
<div>
  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Page Title</h1>
  <p className="text-sm sm:text-[16px] text-gray-600">Descriptive subtitle</p>
</div>
```

### Horizontal Scrollable Strip (general)
```jsx
<div className="flex gap-{n} overflow-x-auto scrollbar-hide pb-1">
  {/* flex-shrink-0 on each child */}
</div>
```

---

## 12. Third-Party Dependencies

| Library | Usage |
|---|---|
| `shadcn/ui` | `Button`, `Card`, `CardContent`, `Input`, `Label`, `DropdownMenu` — use the CVA variants, override with Tailwind classes. Never restyle via inline `style={}`. |
| `react-day-picker` | `DayPicker` with custom `classNames` + `modifiersClassNames`. Selected: `fuchsia-600`. Today: `fuchsia-500`. Use `.compact-daypicker` CSS class for dense/range pickers (purple-500 accent). |
| `lucide-react` | Sole icon library. Use `w-4 h-4` or `w-5 h-5` as standard. `w-10 h-10` for hero/empty state icons. |
| `sonner` | Toast notifications via `toast.success()`, `toast.error()`, `toast.loading()`. `<Toaster expand />` is mounted at root — do not add another. |
| `tailwind-merge` + `clsx` | Always use the `cn()` utility from `@/lib/utils` for conditional class merging. Never use string concatenation for class names. |
| `tw-animate-css` | Imported globally in `globals.css`. Provides animation utilities. |

---

## Custom CSS Classes

Defined in `globals.css`:

| Class | Effect |
|---|---|
| `.scrollbar-hide` | Hides scrollbars cross-browser (webkit + Firefox `scrollbar-width: none`) |
| `.compact-daypicker` | Dense date picker override: 24px cells, 13px font, purple-500 accent. Use on availability/range pickers only. |
| `font-family-seasons` | Applies `--font-family-seasons` (The Seasons). Use for display headings only. |

---

*Last updated: automatically generated from codebase audit.*
