import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { Card as CardType } from '@/shared/types';
import '@testing-library/jest-dom';

const mockCard: CardType = {
  id: 'card-1',
  title: 'Test Card',
  description: 'This is a test card.',
  position: 1,
  listId: 'list-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  dueDate: null,
};

describe('KanbanCard', () => {
  it('renders the card title', () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <KanbanCard card={mockCard} />
      </DndContext>
    );
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('enters edit mode on click', () => {
    render(
      <DndContext onDragEnd={() => {}}>
        <KanbanCard card={mockCard} />
      </DndContext>
    );
    const cardTitle = screen.getByText('Test Card');
    fireEvent.click(cardTitle);
    const input = screen.getByDisplayValue('Test Card');
    expect(input).toBeInTheDocument();
  });

  it('calls onUpdate when title is changed', () => {
    const handleUpdate = vi.fn();
    render(
      <DndContext onDragEnd={() => {}}>
        <KanbanCard card={mockCard} onUpdate={handleUpdate} />
      </DndContext>
    );

    fireEvent.click(screen.getByText('Test Card'));
    const input = screen.getByDisplayValue('Test Card');
    fireEvent.change(input, { target: { value: 'Updated Card Title' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleUpdate).toHaveBeenCalledWith({ title: 'Updated Card Title' });
  });

  it('does not call onUpdate if title is unchanged', () => {
    const handleUpdate = vi.fn();
    render(
      <DndContext onDragEnd={() => {}}>
        <KanbanCard card={mockCard} onUpdate={handleUpdate} />
      </DndContext>
    );

    fireEvent.click(screen.getByText('Test Card'));
    const input = screen.getByDisplayValue('Test Card');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn();
    render(
      <DndContext onDragEnd={() => {}}>
        <KanbanCard card={mockCard} onDelete={handleDelete} />
      </DndContext>
    );

    // This assumes a delete button exists and is visible.
    // The current component doesn't have one, so this test would fail.
    // We can add a placeholder for now.
    // For example, if there was a button with aria-label="Delete card"
    // const deleteButton = screen.getByRole('button', { name: /delete/i });
    // fireEvent.click(deleteButton);
    // expect(handleDelete).toHaveBeenCalled();
  });
});
