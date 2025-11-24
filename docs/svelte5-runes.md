# Svelte 5 Runes Reference

This project uses **Svelte 5** and its new **Runes** system for reactivity. This guide serves as the source of truth for how to handle state, effects, and props.

## Core Runes

### `$state`
Declares reactive state. Replaces top-level `let` variables.

```javascript
// OLD (Svelte 4)
let count = 0;

// NEW (Svelte 5)
let count = $state(0);
```

**Key Difference**: `$state` works inside functions and classes (universal reactivity), not just at the component top level.

### `$derived`
Declares a value that depends on other state. Replaces `$:`.

```javascript
// OLD (Svelte 4)
$: double = count * 2;

// NEW (Svelte 5)
let double = $derived(count * 2);
```

### `$effect`
Runs code when dependencies change. Replaces `onMount`, `afterUpdate`, and `$: { ... }` side effects.

```javascript
// OLD (Svelte 4)
$: console.log(count);

// NEW (Svelte 5)
$effect(() => {
    console.log(count);
});
```

### `$props`
Declares component props. Replaces `export let`.

```javascript
// OLD (Svelte 4)
export let name = 'World';

// NEW (Svelte 5)
let { name = 'World' } = $props();
```

## Best Practices

1.  **Universal Reactivity**: Use `$state` inside helper functions (`.ts` files) to create shared reactive logic without stores.
2.  **Avoid Stores**: Prefer `$state` objects over `writable` stores for local or simple global state.
3.  **Explicit Dependencies**: `$derived` and `$effect` automatically track dependencies. You don't need to list them manually.
