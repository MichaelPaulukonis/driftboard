# Drag and Drop in DriftBoard

A core feature of any Kanban board is the ability to visually reorder items. In DriftBoard, this functionality is powered by **`@dnd-kit`**, a modern, lightweight, and highly performant library for drag and drop in React.

## Why `@dnd-kit`?

We chose `@dnd-kit` for several key reasons:

- **Accessibility**: It's built with accessibility in mind, providing features like keyboard support and screen reader announcements out of the box.
- **Performance**: It's designed to be fast and avoids common performance pitfalls associated with drag-and-drop libraries.
- **Customizability**: It's a "headless" library, meaning it provides the core logic but gives us full control over the rendering and styling of our components.
- **Touch Support**: It works seamlessly on both desktop and mobile devices.

## Core Concepts of `@dnd-kit`

The implementation in DriftBoard revolves around a few key concepts from the library.

### 1. `DndContext`

This is the main provider component that wraps the part of your application where you want to enable drag and drop. It provides the context for all sensors, collision detection algorithms, and event listeners. In DriftBoard, this is typically placed at the top level of the `BoardDetailPage`.

```tsx
<DndContext onDragEnd={handleDragEnd}>
  {/* All your draggable lists and cards go here */}
</DndContext>
```

### 2. Sensors

Sensors are how `@dnd-kit` detects input from different devices. We use:
- **`PointerSensor`**: For mouse, touch, and stylus input.
- **`KeyboardSensor`**: For enabling keyboard-based reordering for accessibility.

### 3. `SortableContext`

To create a list of items that can be reordered, we wrap them in a `SortableContext`. This context needs an array of the unique IDs of the sortable items and a sorting strategy.

- **Lists**: The columns on our board are wrapped in a horizontal `SortableContext`.
- **Cards**: The cards within each list are wrapped in a vertical `SortableContext`.

```tsx
// For a list of cards
<SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
  {cards.map(card => <SortableCard key={card.id} id={card.id} />)}
</SortableContext>
```

### 4. `useSortable` Hook

This hook is used inside a component to make it draggable, droppable, and sortable within a `SortableContext`. It provides the necessary props and event listeners that you need to attach to your component's DOM node.

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableCard = ({ id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Card content */}
    </div>
  );
};
```

### 5. Event Handling (`onDragEnd`)

The `onDragEnd` event handler is the most critical piece of logic. It fires after a drag operation is completed. Inside this function, we:

1.  **Check if a move occurred**: We compare the `active` (the item being dragged) and `over` (the droppable area it landed on) properties of the event object.
2.  **Determine the type of move**: Was a card moved within the same list, or to a different list? Was a list reordered?
3.  **Dispatch an action**: We call a mutation from our RTK Query API to update the item's position on the backend.
4.  **Use Optimistic Updates**: To make the UI feel instantaneous, we update the local Redux state immediately, assuming the API call will succeed. RTK Query handles rolling back the change automatically if the API call fails.
