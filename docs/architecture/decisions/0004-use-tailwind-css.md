# ADR 0004: Use Tailwind CSS for Styling

## Status

Accepted

## Context

The application needs a styling solution that:
- Enables rapid UI development
- Maintains consistency across components
- Supports responsive design
- Has good performance characteristics
- Works well with React components

### Options Considered

1. **CSS Modules**
   - Scoped styles
   - No utility classes
   - More CSS files to manage

2. **Styled Components / Emotion**
   - CSS-in-JS
   - Runtime cost
   - Co-located styles

3. **Tailwind CSS**
   - Utility-first
   - No custom CSS needed for most cases
   - Built-in responsive design
   - PurgeCSS for production

4. **Material-UI Styling**
   - Integrated with MUI components
   - Theme-based
   - Tied to component library

## Decision

We chose **Tailwind CSS** as the primary styling solution, with Emotion available for complex dynamic styles.

## Rationale

1. **Development Speed**: Utility classes enable rapid prototyping without switching files.

2. **Consistency**: Predefined design tokens (spacing, colors, typography) ensure consistency.

3. **Performance**: PurgeCSS removes unused styles, resulting in small production bundles.

4. **Responsive Design**: Built-in responsive utilities (`sm:`, `md:`, `lg:`).

5. **No Naming**: No need to invent class names; utilities are descriptive.

6. **Customization**: Easy to extend via `tailwind.config.js`.

## Implementation

### Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#f97316',
          600: '#ea580c',
        },
      },
      animation: {
        'pulse-light': 'pulse-light 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
```

### Usage Patterns

```jsx
// Basic component
<button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white">
  Submit
</button>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Conditional classes with clsx
<div className={clsx(
  'p-4 rounded-lg',
  isActive && 'bg-blue-100 border-blue-500',
  !isActive && 'bg-gray-100 border-gray-300'
)}>

// With tailwind-merge for conflicts
<button className={twMerge('px-4 py-2 bg-blue-500', className)}>
```

### When to Use Emotion

For complex dynamic styles:

```jsx
// Complex animations or computed values
const AnimatedBox = styled.div`
  transform: rotate(${props => props.angle}deg);
  transition: transform 0.3s ease;
`;
```

## Consequences

### Positive

- Faster development with utility classes
- Consistent design system
- Small production bundle
- Excellent responsive support
- Easy to maintain and refactor

### Negative

- Long class strings can be hard to read
- Learning curve for utility naming
- Requires tooling (Tailwind IntelliSense)

### Mitigations

- Use VS Code Tailwind IntelliSense extension
- Extract common patterns to components
- Use `clsx` and `tailwind-merge` for readability
- Document custom utilities

## Related

- [Tailwind Configuration](../../../tailwind.config.js)
- [Global Styles](../../../src/styles/globals.css)