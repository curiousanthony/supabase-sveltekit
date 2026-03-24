# Component Testing & Playground Rules

Whenever you need to create a test page to verify a component, element, or specific UI logic, follow these rules:

## 1. Location

All test pages must live in the `src/routes/playground` directory.

- Create a dedicated subdirectory for each component or feature being tested.
- Example: `src/routes/playground/card-checkbox/+page.svelte`

## 2. Content & Coverage

Test pages should not just be "scratchpads". They should serve as living documentation and stress tests for the component.

- **Showcase all states**: checked, unchecked, disabled, loading, error, etc.
- **Showcase all variants**: different sizes, colors, icons, and layout configurations.
- **Contextual use cases**: Place the component in different containers (e.g., narrow sidebar, wide main area, inside a form) to ensure responsiveness and layout stability.
- **Interactions**: Include interactive elements (buttons, toggles) to trigger state changes within the test page to verify reactivity.

## 3. SEO & Accessibility

Even on test pages, maintain high standards:

- **Title Tags**: Use a descriptive `<title>` (e.g., "Playground: Card Checkbox").
- **Meta Description**: Add a brief summary of what the test page covers.
- **Heading Structure**: Use a single `<h1>` for the page title.
- **Semantic HTML**: Use proper tags (`<section>`, `<article>`, etc.).
- **Unique IDs**: Ensure all interactive elements have unique, descriptive IDs for automated browser testing.

## 4. Cleanup

- These pages are intended for development and testing.
- Do not include them in the main navigation of the app, but they can be accessed directly via URL (e.g., `/playground/my-component`).
- If a test page is no longer needed after a feature is fully verified and covered by official tests/stories, it can be removed. However, keeping them as a "playground" for future maintenance is encouraged.
