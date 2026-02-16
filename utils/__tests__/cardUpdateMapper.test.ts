import { mapCardUpdatesToDb } from '../cardUpdateMapper';

describe('mapCardUpdatesToDb', () => {
  it('returns an empty object when no supported fields are provided', () => {
    expect(mapCardUpdatesToDb({})).toEqual({});
  });

  it('maps present fields to database column names', () => {
    const result = mapCardUpdatesToDb({
      dueDate: '2025-01-10T00:00:00.000Z',
      estimatedHours: 5,
      actualHours: 3,
      priority: 'high',
      assignedTo: ['Alex'],
      tags: ['api'],
      createdBy: 'Taylor',
    });

    expect(result).toEqual({
      due_date: '2025-01-10T00:00:00.000Z',
      estimated_hours: 5,
      actual_hours: 3,
      priority: 'high',
      assigned_to: ['Alex'],
      tags: ['api'],
      created_by: 'Taylor',
    });
  });

  it('keeps hasOwnProperty behavior for explicitly undefined fields', () => {
    const result = mapCardUpdatesToDb({
      dueDate: undefined,
      estimatedHours: undefined,
      actualHours: undefined,
      priority: undefined,
      assignedTo: undefined,
      tags: undefined,
      createdBy: undefined,
    });

    expect(result).toEqual({
      due_date: null,
      estimated_hours: null,
      actual_hours: null,
      priority: null,
      assigned_to: [],
      tags: [],
      created_by: null,
    });
  });
});
