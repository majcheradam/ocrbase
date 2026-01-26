---
name: vercel-design-guidelines
description: Check web interfaces against Vercel's design guidelines. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", "check my site against best practices", or "apply Vercel design guidelines".
---

# Vercel Design Guidelines

Review web interfaces against Vercel's comprehensive design guidelines and propose fixes.

## How It Works

1. Read the user's code (components, CSS, HTML)
2. Check against Vercel design guidelines (interactions, animations, layout, content, forms, performance, design, copywriting)
3. Report violations with specific line references
4. Propose concrete fixes with code examples

## Usage

When a user asks to review their UI or check against design guidelines:

1. Fetch the guidelines from both URLs below
2. Read the relevant source files (components, styles, HTML)
3. Analyze the code against each applicable guideline category
4. Report findings grouped by category with severity

**Guidelines URLs:**

- **Structured rules:** https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/refs/heads/main/AGENTS.md (MUST/SHOULD/NEVER directives)
- **Full details:** https://vercel.com/design/guidelines (rich explanations and examples)

Fetch both for comprehensive coverage — AGENTS.md for structured checklist, full site for context and examples.

## Audit Categories

### Interactions

- Keyboard accessibility
- Focus management
- Hit targets (minimum 24px, 44px on mobile)
- Loading states
- URL persistence

### Animations

- Reduced motion support (`prefers-reduced-motion`)
- GPU acceleration
- Easing functions
- Interruptibility
- No `transition: all`

### Layout

- Optical adjustment
- Alignment
- Responsive testing
- Safe areas

### Content

- Inline help
- Skeleton states
- Empty states
- Typography
- Accessibility

### Forms

- Labels (always associated with inputs)
- Validation
- Autocomplete
- Error handling
- Submit behavior

### Performance

- Re-renders
- Layout thrashing
- Virtualization
- Preloading

### Design

- Shadows
- Borders
- Border radii
- Contrast (APCA standards)
- Color accessibility

### Copywriting

- Active voice
- Title case
- Clarity
- Error messaging (show how to fix, not just what's wrong)

## Output Format

Present findings as:

````
## {Category} Issues

### {Severity}: {Guideline Name}
**File:** `path/to/file.tsx:42`
**Issue:** {Description of the violation}
**Guideline:** {Brief guideline reference}
**Fix:**
```{language}
{Proposed code fix}
````

```

Severity levels:
- **Critical**: Accessibility violations, broken functionality
- **Warning**: UX issues, performance concerns
- **Suggestion**: Polish, best practices

## Example Review

```

## Interactions Issues

### Critical: Keyboard Accessibility

**File:** `components/Modal.tsx:28`
**Issue:** Modal lacks focus trap - keyboard users can tab outside
**Guideline:** Implement focus traps per WAI-ARIA patterns
**Fix:**

```tsx
// Add focus trap using Base UI's FocusTrap or similar
import { FocusTrap } from "@base-ui-components/react/focus-trap";

<FocusTrap>
  <ModalContent>{children}</ModalContent>
</FocusTrap>;
```

### Warning: Loading State Duration

**File:** `components/Button.tsx:15`
**Issue:** No minimum loading duration - causes flicker on fast responses
**Guideline:** Add 150-300ms delay and 300-500ms minimum visibility
**Fix:**

```tsx
const [isLoading, setIsLoading] = useState(false);
const minimumLoadingTime = 300;

async function handleClick() {
  setIsLoading(true);
  const start = Date.now();
  await action();
  const elapsed = Date.now() - start;
  if (elapsed < minimumLoadingTime) {
    await new Promise((r) => setTimeout(r, minimumLoadingTime - elapsed));
  }
  setIsLoading(false);
}
```

```

## Quick Checklist

For rapid reviews, check these high-impact items first:

- [ ] All interactive elements keyboard accessible
- [ ] Visible focus rings on focusable elements
- [ ] Hit targets ≥24px (44px on mobile)
- [ ] Form inputs have associated labels
- [ ] Loading states don't flicker
- [ ] `prefers-reduced-motion` respected
- [ ] No `transition: all`
- [ ] Errors show how to fix, not just what's wrong
- [ ] Color contrast meets APCA standards
- [ ] No zoom disabled

## Present Results to User

After reviewing:

```

# Design Guidelines Audit

Reviewed {N} files against Vercel design guidelines.

## Summary

- Critical: {N} issues
- Warning: {N} issues
- Suggestions: {N} items

{Detailed findings by category}

## Recommended Priority

1. {First critical fix}
2. {Second critical fix}
   ...

```

```
