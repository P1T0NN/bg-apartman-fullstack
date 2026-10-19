---
name: BGApartman
description: A trusted booking marketplace for quality stays across Serbia.
colors:
  primary: 'oklch(0.7 0.18 65)'
  primaryForeground: 'oklch(0.15 0.02 60)'
  background: 'oklch(0.99 0.005 85)'
  foreground: 'oklch(0.15 0.02 60)'
  header: 'oklch(0.18 0.015 60)'
  headerForeground: 'oklch(0.95 0.01 80)'
  card: 'oklch(1 0 0)'
  cardForeground: 'oklch(0.15 0.02 60)'
  secondary: 'oklch(0.96 0.01 80)'
  secondaryForeground: 'oklch(0.25 0.02 60)'
  muted: 'oklch(0.96 0.01 80)'
  mutedForeground: 'oklch(0.5 0.02 60)'
  accent: 'oklch(0.72 0.16 55)'
  accentForeground: 'oklch(0.15 0.02 60)'
  destructive: 'oklch(0.58 0.22 25)'
  success: 'oklch(0.527 0.154 150.069)'
  successForeground: 'oklch(1 0 0)'
  warning: 'oklch(0.75 0.14 80)'
  border: 'oklch(0.9 0.01 80)'
  input: 'oklch(0.9 0.01 80)'
  ring: 'oklch(0.7 0.18 65)'
typography:
  display:
    fontFamily: 'Inter Variable, sans-serif'
    fontSize: '48px / 60px / 72px'
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: '-0.025em'
  body:
    fontFamily: 'Inter Variable, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Inter Variable, sans-serif'
    fontSize: '12px / 14px'
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  2xl: '18px'
  3xl: '22px'
  4xl: '26px'
spacing:
  section-sm: '32px'
  section-md: '64px'
  section-lg: '96px'
  container-inline-mobile: '16px'
  container-inline-desktop: '24px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primaryForeground}'
    rounded: '{rounded.4xl}'
    padding: '8px 12px'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.4xl}'
    padding: '8px 12px'
    height: '36px'
  input-default:
    backgroundColor: '{colors.input}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.3xl}'
    padding: '4px 12px'
    height: '36px'
  badge-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primaryForeground}'
    rounded: '{rounded.3xl}'
    height: '20px'
  card-default:
    backgroundColor: '{colors.card}'
    textColor: '{colors.cardForeground}'
    rounded: '{rounded.4xl}'
  header-public:
    backgroundColor: '{colors.header}'
    textColor: '{colors.headerForeground}'
    height: '64px'
---

# Design System: BGApartman

## 1. Overview

**Creative North Star: "The Trusted Stay Guide"**

BGApartman promises travelers worldwide quality accommodations across Serbia at the best possible prices. The platform helps guests find and book those stays, and gives accommodation owners a path to become hosts and list their places.

The current visual system is warm and familiar: a near-white canvas, charcoal navigation and dark bands, amber actions, Inter-led typography, and generously rounded components. This file records that system as it exists. Extend the interface within its current hierarchy and use familiar booking conventions.

**Key Characteristics:**

- Trustworthy, welcoming, quality-focused
- Warm light surfaces anchored by charcoal and amber
- Familiar guest and host workflows
- Existing visual decisions are preserved unless a task explicitly changes them

## 2. Colors

The canonical color values are the OKLCH tokens in the frontmatter, extracted from the global theme. The storefront uses warm light surfaces, a charcoal header, and amber for primary actions. Semantic success, warning, and destructive colors remain reserved for their corresponding states.

### Primary

- **BGApartman Amber**: The primary action and focus color. Use it for clear calls to action and meaningful selection states.
- **Warm Accent Amber**: A nearby accent role already present in the theme. Keep it within existing component treatments.

### Neutral

- **Warm Porcelain**: The page background that keeps long browsing sessions light.
- **Soft Sand**: Secondary and muted surfaces for grouping related content.
- **Deep Earth**: The main text color on light surfaces.
- **Smoked Charcoal**: The public header and intentionally dark page bands.
- **Near-White Card**: The raised card surface against the warm page background.
- **Quiet Border**: The divider and outline color for light surfaces.

### Status

- **Success Green**, **Warning Ochre**, and **Destructive Red** communicate their matching system states. Do not use them as general decoration.

### Named Rules

**The Amber Action Rule.** Reserve amber for primary actions, focus, or meaningful highlights; keep booking information and prices readable.

## 3. Typography

**Display Font:** Inter Variable, sans-serif  
**Body Font:** Inter Variable, sans-serif  
**Label Font:** Inter Variable, sans-serif

**Character:** Clear, familiar, and compact enough for booking details. The global typeface is Inter Variable; preserve section-specific typography already present in the public homepage.

### Hierarchy

- **Display** (semibold, 48px to 72px, tight leading): Homepage hero and major promotional headings.
- **Headline** (semibold, 30px to 48px): Section titles and key page headings.
- **Title** (semibold, 16px to 20px): Accommodation names, card titles, and local section headings.
- **Body** (regular, 16px): Explanations and booking information. Keep prose around 65 to 75 characters per line where the layout allows.
- **Label** (medium, 12px to 14px): Metadata, field labels, badges, and compact controls.

## 4. Elevation

Most layouts use spacing, borders, and tonal surfaces to define structure. The shared card uses a subtle medium shadow and a faint outline to separate a light card from the page. Keep elevation structural and restrained; do not add decorative layers to existing surfaces.

**The Quiet Lift Rule.** Use the existing card shadow to clarify grouping, never as an ornamental effect.

## 5. Components

- **Public header:** Sticky, 64px high, charcoal with light foreground text. Keep navigation and account actions within this established treatment.
- **Buttons:** The default action uses the amber primary token, medium text, and a pill-like 26px radius. The standard size is 36px high. Outline, secondary, ghost, and status variants retain their semantic roles.
- **Inputs:** Standard controls are 36px high with a soft input fill, muted placeholder, and a pill-like 22px radius. Preserve visible focus and invalid states.
- **Cards:** The shared card uses the near-white card token, a 26px radius, restrained shadow, and a faint outline. Accommodation tiles remain image-led and show location, name, rating, capacity, and nightly price.
- **Badges:** Compact, 20px high, pill-shaped labels for statuses and booking modes. Keep their text concise and their semantic colors meaningful.
- **Sections:** Full-width bands use the shared section component. Its content stays centered at the established width with 16px mobile and 24px desktop side padding; vertical rhythm uses the existing 32px, 64px, and 96px sizes.
- **Search:** Keep destination, dates, and guest selection in the existing search composition. Use familiar field behavior and preserve validation and keyboard access.

**The Existing System Rule.** Preserve established component shapes, page layouts, and interaction patterns unless the task explicitly changes them.

## 6. Do's and Don'ts

### Do

- Reuse the existing semantic color tokens and component variants.
- Follow familiar booking and marketplace conventions.
- Preserve the visual design of existing sections when making unrelated changes.
- Keep property details, prices, booking terms, and host actions easy to scan.
- Maintain keyboard focus, readable contrast, and touch targets.

### Don't

- Redesign a visually complete surface unless the task asks for that change.
- Add a new palette, type system, shadow style, or motion treatment without a concrete need.
- Invent unusual booking interactions where an established pattern works.
- Use success, warning, or destructive colors decoratively.
- Treat the best-price promise as a reason to obscure fees or booking terms.
