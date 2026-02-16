import { Card } from '../types';

export const mapCardUpdatesToDb = (updates: Partial<Card>) => {
  const hasUpdateField = (field: keyof Card) =>
    Object.prototype.hasOwnProperty.call(updates, field);

  const dbUpdates: Record<string, unknown> = {};

  if (hasUpdateField('dueDate')) dbUpdates.due_date = updates.dueDate ?? null;
  if (hasUpdateField('estimatedHours')) dbUpdates.estimated_hours = updates.estimatedHours ?? null;
  if (hasUpdateField('actualHours')) dbUpdates.actual_hours = updates.actualHours ?? null;
  if (hasUpdateField('priority')) dbUpdates.priority = updates.priority ?? null;
  if (hasUpdateField('assignedTo')) dbUpdates.assigned_to = updates.assignedTo ?? [];
  if (hasUpdateField('tags')) dbUpdates.tags = updates.tags ?? [];
  if (hasUpdateField('createdBy')) dbUpdates.created_by = updates.createdBy ?? null;

  return dbUpdates;
};
