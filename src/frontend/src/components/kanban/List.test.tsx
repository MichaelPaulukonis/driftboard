import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { List } from './List';
import { List as ListType } from '@/shared/types';
import '@testing-library/jest-dom';

const mockList: ListType = {
  id: 'list-1',
  name: 'Test List',
  position: 1,
  boardId: 'board-1',
  cards: [
    { id: 'card-1', title: 'Card 1', position: 1, listId: 'list-1', description: '', createdAt: new Date(), updatedAt: new Date(), dueDate: null },
    { id: 'card-2', title: 'Card 2', position: 2, listId: 'list-1', description: '', createdAt: new Date(), updatedAt: new Date(), dueDate: null },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('List', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DndContext onDragEnd={() => {}}>
      <SortableContext items={(mockList.cards || []).map(c => c.id)}>
        {children}
      </SortableContext>
    </DndContext>
  );

  it('renders the list name', () => {
    render(
      <Wrapper>
        <List list={mockList} />
      </Wrapper>
    );
    expect(screen.getByText('Test List')).toBeInTheDocument();
  });

  it('renders all cards in the list', () => {
    render(
      <Wrapper>
        <List list={mockList} />
      </Wrapper>
    );
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('calls onUpdate when list name is edited', () => {
    const handleUpdate = vi.fn();
    render(
      <Wrapper>
        <List list={mockList} onUpdate={handleUpdate} />
      </Wrapper>
    );

    fireEvent.click(screen.getByText('Test List'));
    const input = screen.getByDisplayValue('Test List');
    fireEvent.change(input, { target: { value: 'Updated List Name' } });
    fireEvent.blur(input);

    expect(handleUpdate).toHaveBeenCalledWith({ name: 'Updated List Name' });
  });

  it('calls onCreateCard when "Add a card" is clicked and form is submitted', () => {
    const handleCreateCard = vi.fn();
    render(
      <Wrapper>
        <List list={mockList} onCreateCard={handleCreateCard} />
      </Wrapper>
    );
    
    const addCardButton = screen.getByRole('button', { name: /Add a card/i });
    fireEvent.click(addCardButton);

    const input = screen.getByPlaceholderText('Enter a title for this card...');
    fireEvent.change(input, { target: { value: 'New Card Title' } });
    
    const saveButton = screen.getByRole('button', { name: 'Add card' });
    fireEvent.click(saveButton);

    expect(handleCreateCard).toHaveBeenCalledWith({ title: 'New Card Title' });
  });
});
