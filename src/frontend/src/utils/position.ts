/**
 * Calculates the position for a new item inserted between two others.
 * @param before - The position of the item before the new item.
 * @param after - The position of the item after the new item.
 * @returns A new position value between the two provided positions.
 */
export const calculatePosition = (before?: number, after?: number): number => {
  if (before === undefined && after === undefined) {
    // No items in the list yet
    return 1000;
  }
  if (before === undefined) {
    // Inserting at the beginning
    return after! / 2;
  }
  if (after === undefined) {
    // Inserting at the end
    return before + 1000;
  }
  // Inserting in the middle
  return (before + after) / 2;
};
