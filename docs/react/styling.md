# Styling in DriftBoard

DriftBoard's styling strategy is built on modern, utility-first principles to ensure consistency, maintainability, and rapid development. We use a combination of **Tailwind CSS** for utility classes and **ShadCN/UI** for base components.

## 1. Tailwind CSS

[Tailwind CSS](https://tailwindcss.com/) is a utility-first CSS framework. Instead of writing custom CSS classes like `.btn-primary`, you compose styles directly in your HTML/JSX using pre-existing utility classes.

**Example:**

```tsx
// Instead of this:
// <button class="btn btn-primary">Save</button>
// .btn { padding: 0.5rem 1rem; border-radius: 0.25rem; }
// .btn-primary { background-color: blue; color: white; }

// We do this:
<button className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
  Save
</button>
```

### Key Advantages:

- **Speed**: You can build custom designs without ever leaving your HTML.
- **Consistency**: You're using values from a predefined design system (spacing, colors, etc.), which keeps the UI consistent.
- **Performance**: Tailwind automatically removes all unused CSS in production builds, resulting in a very small final CSS file.
- **Responsive Design**: You can apply utilities for specific screen sizes using prefixes like `md:`, `lg:`, etc.

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* This div is full-width on small screens, 50% on medium screens, and 33% on large screens */}
</div>
```

## 2. ShadCN/UI

[ShadCN/UI](https://ui.shadcn.com/) is not a traditional component library. Instead, it's a collection of beautifully designed, reusable components that you copy and paste directly into your project.

### Key Features:

- **You Own the Code**: The components live in `src/frontend/src/components/ui/`. This means you can modify them to fit your exact needs without fighting against a library's opinions.
- **Built on Radix UI**: The components are built on top of [Radix UI](https://www.radix-ui.com/), which provides accessible, unstyled, and highly functional primitives. This handles all the tricky parts like accessibility (ARIA attributes, keyboard navigation) and state management for things like dialogs and dropdowns.
- **Styled with Tailwind CSS**: The components are styled using Tailwind CSS, so they fit perfectly into our existing styling system.

### How We Use It:

We use ShadCN/UI components as the foundational building blocks for our application.

- **Directory**: `src/frontend/src/components/ui/`
- **Examples**: `Button.tsx`, `Dialog.tsx`, `Input.tsx`, `Card.tsx` (the primitive, not the Kanban card).

When we need a more complex UI element, we compose these primitives together. For example, our `BoardForm` might use the ShadCN `Dialog`, `Input`, and `Button` components to create the form interface.

## 3. Custom CSS and Theming

While Tailwind covers most of our needs, we have a few global styles and CSS variables defined in `src/frontend/src/index.css`.

- **CSS Variables**: We define our primary color palette as CSS variables in the `:root` selector. This allows for easy theming and consistency. Tailwind is configured to use these variables.

```css
/* From index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... and so on */
}
```

This combination of Tailwind and ShadCN/UI gives us the best of both worlds: the speed and consistency of a utility-first framework, and the flexibility and ownership of custom-built components.
