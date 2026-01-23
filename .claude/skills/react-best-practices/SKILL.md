---
name: react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
---

# React Best Practices

## Overview

Comprehensive performance optimization guide for React and Next.js applications, containing 40+ rules across 8 categories. Rules are prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Priority-Ordered Guidelines

| Priority | Category                  | Impact      |
| -------- | ------------------------- | ----------- |
| 1        | Eliminating Waterfalls    | CRITICAL    |
| 2        | Bundle Size Optimization  | CRITICAL    |
| 3        | Server-Side Performance   | HIGH        |
| 4        | Client-Side Data Fetching | MEDIUM-HIGH |
| 5        | Re-render Optimization    | MEDIUM      |
| 6        | Rendering Performance     | MEDIUM      |
| 7        | JavaScript Performance    | LOW-MEDIUM  |
| 8        | Advanced Patterns         | LOW         |

## Category 1: Eliminating Waterfalls (CRITICAL)

### Rule: Defer await until needed

**Bad:**

```tsx
async function Page() {
  const data = await fetchData(); // Blocks everything
  return <Component data={data} />;
}
```

**Good:**

```tsx
async function Page() {
  const dataPromise = fetchData(); // Start immediately
  return <Component dataPromise={dataPromise} />;
}
```

### Rule: Use Promise.all() for independent operations

**Bad:**

```tsx
const user = await getUser();
const posts = await getPosts();
const comments = await getComments();
```

**Good:**

```tsx
const [user, posts, comments] = await Promise.all([
  getUser(),
  getPosts(),
  getComments(),
]);
```

### Rule: Start promises at the earliest point

**Bad:**

```tsx
function Component() {
  useEffect(() => {
    fetchData().then(setData); // Too late
  }, []);
}
```

**Good:**

```tsx
// In route loader or parent component
const dataPromise = fetchData();

function Component({ dataPromise }) {
  const data = use(dataPromise);
}
```

### Rule: Use Suspense boundaries for streaming

```tsx
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>
```

## Category 2: Bundle Size Optimization (CRITICAL)

### Rule: Avoid barrel file imports

**Bad:**

```tsx
import { Button } from "@/components"; // Pulls entire barrel
import { format } from "date-fns"; // Pulls entire library
```

**Good:**

```tsx
import { Button } from "@/components/ui/button";
import { format } from "date-fns/format";
```

### Rule: Use next/dynamic for heavy components

```tsx
const HeavyChart = dynamic(() => import("./Chart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### Rule: Defer third-party libraries

```tsx
// Load analytics only after interaction
const loadAnalytics = () => import("analytics").then((m) => m.init());

useEffect(() => {
  window.addEventListener("click", loadAnalytics, { once: true });
}, []);
```

### Rule: Configure optimizePackageImports

```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ["lodash", "date-fns", "@base-ui/react"],
  },
};
```

## Category 3: Server-Side Performance (HIGH)

### Rule: Use React.cache() for request deduplication

```tsx
import { cache } from "react";

const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

### Rule: Implement LRU caching for expensive computations

```tsx
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, Data>({ max: 100 });

async function getData(key: string) {
  if (cache.has(key)) return cache.get(key);
  const data = await expensiveComputation(key);
  cache.set(key, data);
  return data;
}
```

### Rule: Minimize serialization overhead

**Bad:**

```tsx
// Passing entire objects when only ID needed
<ClientComponent user={user} />
```

**Good:**

```tsx
<ClientComponent userId={user.id} />
```

## Category 4: Client-Side Data Fetching (MEDIUM-HIGH)

### Rule: Use SWR or React Query for client fetching

```tsx
import useSWR from "swr";

function Profile({ userId }) {
  const { data, error, isLoading } = useSWR(`/api/user/${userId}`, fetcher);

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  return <UserCard user={data} />;
}
```

### Rule: Use lazy state initialization

**Bad:**

```tsx
const [state, setState] = useState(expensiveComputation());
```

**Good:**

```tsx
const [state, setState] = useState(() => expensiveComputation());
```

### Rule: Use startTransition for non-urgent updates

```tsx
import { startTransition } from "react";

function handleSearch(query) {
  startTransition(() => {
    setSearchResults(search(query));
  });
}
```

## Category 5: Re-render Optimization (MEDIUM)

### Rule: Narrow state scope

**Bad:**

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Counter count={count} setCount={setCount} />
      <ExpensiveList /> {/* Re-renders on every count change */}
    </>
  );
}
```

**Good:**

```tsx
function Parent() {
  return (
    <>
      <CounterWithState />
      <ExpensiveList />
    </>
  );
}
```

### Rule: Use useMemo for expensive calculations

```tsx
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
```

### Rule: Use useCallback for stable function references

```tsx
const handleClick = useCallback((id) => {
  setItems((items) => items.filter((item) => item.id !== id));
}, []);
```

## Category 6: Rendering Performance (MEDIUM)

### Rule: Use content-visibility for long lists

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 50px;
}
```

### Rule: Wrap SVG animations to prevent layout recalculation

```tsx
function AnimatedIcon() {
  return (
    <div style={{ contain: "layout" }}>
      <AnimatedSVG />
    </div>
  );
}
```

### Rule: Use conditional rendering over CSS hiding

**Bad:**

```tsx
<div style={{ display: isVisible ? "block" : "none" }}>
  <ExpensiveComponent />
</div>
```

**Good:**

```tsx
{
  isVisible && <ExpensiveComponent />;
}
```

## Category 7: JavaScript Performance (LOW-MEDIUM)

### Rule: Batch DOM updates

```tsx
// Use refs for multiple rapid updates
const counterRef = useRef<HTMLSpanElement>(null);

function increment() {
  if (counterRef.current) {
    counterRef.current.textContent = String(++count);
  }
}
```

### Rule: Build index maps for repeated lookups

**Bad:**

```tsx
items.forEach((item) => {
  const related = otherItems.find((o) => o.id === item.relatedId);
});
```

**Good:**

```tsx
const otherItemsById = new Map(otherItems.map((o) => [o.id, o]));
items.forEach((item) => {
  const related = otherItemsById.get(item.relatedId);
});
```

### Rule: Use immutable array methods

```tsx
// Prefer these for predictable React updates
const updated = items.with(index, newValue);
const filtered = items.toSpliced(index, 1);
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
```

## Category 8: Advanced Patterns (LOW)

### Rule: Use useSyncExternalStore for external state

```tsx
const value = useSyncExternalStore(
  store.subscribe,
  store.getSnapshot,
  store.getServerSnapshot
);
```

### Rule: Implement optimistic updates

```tsx
const [optimisticItems, addOptimisticItem] = useOptimistic(
  items,
  (state, newItem) => [...state, { ...newItem, pending: true }]
);
```

## Quick Reference Checklist

- [ ] No sequential awaits for independent data
- [ ] Using Promise.all() for parallel fetches
- [ ] No barrel file imports
- [ ] Heavy components use dynamic imports
- [ ] Suspense boundaries around async components
- [ ] State scoped to smallest necessary component
- [ ] useMemo/useCallback where beneficial
- [ ] content-visibility for long lists
