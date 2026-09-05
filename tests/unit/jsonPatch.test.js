const { applyJsonPatch, parsePointer, getValueAtPath } = require('../../src/utils/jsonPatch');
const AppError = require('../../src/exceptions/AppError');

describe('JSON Patch Utility (RFC 6902)', () => {
  let target;

  beforeEach(() => {
    target = {
      id: 'T006',
      name: 'timtim',
      description: 'Test user description',
      location: 'cg',
      properties: {
        from: {
          city: 'Mumbai',
          code: 'BOM',
          country: 'India',
          name: 'Chhatrapati Shivaji International Airport',
        },
        to: {
          city: 'Bangalore',
          code: 'BLR',
          country: 'India',
          name: 'Kempegowda International Airport',
        },
        class: 'Premium Economy Class',
        seat: '3AE',
      },
      tags: ['express', 'node', 'mongodb'],
    };
  });

  it('should handle replace and remove operations with case insensitive path resolution', () => {
    const patches = [
      { op: 'replace', path: '/Name', value: 'Name Updated' },
      { op: 'remove', path: '/Description' },
    ];

    const { target: result } = applyJsonPatch(target, patches);

    expect(result.name).toBe('Name Updated');
    expect(result.description).toBeUndefined();
  });

  it('should handle deep nested property replacement like /properties/from/name', () => {
    const patches = [
      {
        op: 'replace',
        path: '/properties/from/name',
        value: 'Chhatrapati Shivaji Maharaj International Airport',
      },
      {
        op: 'replace',
        path: '/properties/from/code',
        value: 'BOM-UPDATED',
      },
    ];

    const { target: result } = applyJsonPatch(target, patches);

    expect(result.properties.from.name).toBe('Chhatrapati Shivaji Maharaj International Airport');
    expect(result.properties.from.code).toBe('BOM-UPDATED');
  });

  it('should handle add operation for new property or array insertion', () => {
    const patches = [
      { op: 'add', path: '/properties/from/terminal', value: 'T2' },
      { op: 'add', path: '/tags/-', value: 'jest' },
    ];

    const { target: result } = applyJsonPatch(target, patches);

    expect(result.properties.from.terminal).toBe('T2');
    expect(result.tags).toContain('jest');
  });

  it('should handle copy and move operations', () => {
    const patches = [
      { op: 'copy', from: '/location', path: '/backupLocation' },
      { op: 'move', from: '/properties/seat', path: '/properties/assignedSeat' },
    ];

    const { target: result } = applyJsonPatch(target, patches);

    expect(result.backupLocation).toBe('cg');
    expect(result.properties.assignedSeat).toBe('3AE');
    expect(result.properties.seat).toBeUndefined();
  });

  it('should validate test operation successfully', () => {
    const patches = [
      { op: 'test', path: '/location', value: 'cg' },
      { op: 'replace', path: '/location', value: 'Delhi' },
    ];

    const { target: result } = applyJsonPatch(target, patches);

    expect(result.location).toBe('Delhi');
  });

  it('should allow adding whole properties object or nested properties after properties has been removed', () => {
    delete target.properties; // Simulating document where properties was removed

    // Option 1: Add full properties object
    const patchesObj = [
      {
        op: 'add',
        path: '/properties',
        value: {
          from: { city: 'Mumbai', code: 'BOM' },
          class: 'Economy',
        },
      },
    ];

    const { target: result1 } = applyJsonPatch(target, patchesObj);
    expect(result1.properties.from.city).toBe('Mumbai');

    // Option 2: Add via nested pointer path on undefined properties
    delete target.properties;
    const patchesNested = [
      { op: 'add', path: '/properties/from/city', value: 'Delhi' },
    ];

    const { target: result2 } = applyJsonPatch(target, patchesNested);
    expect(result2.properties.from.city).toBe('Delhi');
  });

  it('should throw AppError when test operation fails', () => {
    const patches = [
      { op: 'test', path: '/location', value: 'WrongLocation' },
    ];

    expect(() => applyJsonPatch(target, patches)).toThrow(AppError);
  });

  it('should throw AppError on invalid JSON patch format', () => {
    expect(() => applyJsonPatch(target, 'not-an-array')).toThrow(AppError);
    expect(() => applyJsonPatch(target, [{ op: 'invalid_op', path: '/name' }])).toThrow(AppError);
  });
});
