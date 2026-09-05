const AppError = require('../exceptions/AppError');

/**
 * Normalizes a pointer segment to match object properties.
 * E.g., if target is { name: 'Foo' } and segment is 'Name', it resolves 'Name' to 'name'.
 */
function resolveProperty(target, key) {
  if (target == null || typeof target !== 'object') return key;
  if (key in target) return key;

  // Case-insensitive fallback lookup
  const lowerKey = key.toLowerCase();
  const found = Object.keys(target).find((k) => k.toLowerCase() === lowerKey);
  return found || key;
}

/**
 * Parses JSON pointer (RFC 6901) e.g. "/properties/from/name" -> ["properties", "from", "name"]
 */
function parsePointer(path) {
  if (!path || path === '') return [];
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new AppError(`Invalid JSON patch path '${path}'. Path must start with '/'`, 400);
  }
  return path
    .slice(1)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/**
 * Gets value at path from target object.
 */
function getValueAtPath(target, segments) {
  let curr = target;
  for (let i = 0; i < segments.length; i += 1) {
    if (curr == null) return undefined;
    const key = resolveProperty(curr, segments[i]);
    curr = curr[key];
  }
  return curr;
}

/**
 * Applies a single patch operation to an object.
 */
function applySinglePatch(target, patch) {
  if (!patch || typeof patch !== 'object') {
    throw new AppError('Patch operation must be an object', 400);
  }

  const {
    op,
    path,
    value,
    from,
  } = patch;

  if (!op || typeof op !== 'string') {
    throw new AppError("Patch operation must have a string 'op' field", 400);
  }
  if (!path && op !== 'copy' && op !== 'move') {
    throw new AppError("Patch operation must have a 'path' field", 400);
  }

  const segments = parsePointer(path);

  if (segments.length === 0) {
    if (op === 'replace' || op === 'add') {
      if (typeof value === 'object' && value !== null) {
        Object.assign(target, value);
        return;
      }
    }
    throw new AppError(`Operation '${op}' on root path '/' is not supported`, 400);
  }

  const parentSegments = segments.slice(0, -1);
  const rawLastKey = segments[segments.length - 1];

  // Traverse to parent object
  let parent = target;
  for (let i = 0; i < parentSegments.length; i += 1) {
    const seg = parentSegments[i];
    const resolvedSeg = resolveProperty(parent, seg);
    if (parent[resolvedSeg] == null) {
      if (op === 'add' || op === 'replace') {
        parent[resolvedSeg] = {};
      } else {
        throw new AppError(`Path '${path}' does not exist`, 400);
      }
    }
    parent = parent[resolvedSeg];
  }

  const lastKey = resolveProperty(parent, rawLastKey);

  switch (op.toLowerCase()) {
    case 'replace': {
      if (Array.isArray(parent)) {
        const index = parseInt(lastKey, 10);
        if (Number.isNaN(index) || index < 0 || index >= parent.length) {
          throw new AppError(`Invalid array index in path '${path}'`, 400);
        }
        parent[index] = value;
      } else {
        parent[lastKey] = value;
      }
      break;
    }

    case 'add': {
      if (Array.isArray(parent)) {
        if (lastKey === '-') {
          parent.push(value);
        } else {
          const index = parseInt(lastKey, 10);
          if (Number.isNaN(index) || index < 0 || index > parent.length) {
            throw new AppError(`Invalid array index in path '${path}'`, 400);
          }
          parent.splice(index, 0, value);
        }
      } else {
        parent[lastKey] = value;
      }
      break;
    }

    case 'remove': {
      if (Array.isArray(parent)) {
        const index = parseInt(lastKey, 10);
        if (Number.isNaN(index) || index < 0 || index >= parent.length) {
          throw new AppError(`Invalid array index in path '${path}'`, 400);
        }
        parent.splice(index, 1);
      } else if (typeof parent === 'object' && parent !== null) {
        delete parent[lastKey];
      }
      break;
    }

    case 'copy': {
      if (!from) throw new AppError("Operation 'copy' requires 'from' path", 400);
      const fromSegments = parsePointer(from);
      const valToCopy = getValueAtPath(target, fromSegments);
      if (valToCopy === undefined) {
        throw new AppError(`Path 'from': '${from}' does not exist`, 400);
      }
      const deepCopied = JSON.parse(JSON.stringify(valToCopy));
      applySinglePatch(target, { op: 'add', path, value: deepCopied });
      break;
    }

    case 'move': {
      if (!from) throw new AppError("Operation 'move' requires 'from' path", 400);
      const fromSegments = parsePointer(from);
      const valToMove = getValueAtPath(target, fromSegments);
      if (valToMove === undefined) {
        throw new AppError(`Path 'from': '${from}' does not exist`, 400);
      }
      const deepMoved = JSON.parse(JSON.stringify(valToMove));
      applySinglePatch(target, { op: 'remove', path: from });
      applySinglePatch(target, { op: 'add', path, value: deepMoved });
      break;
    }

    case 'test': {
      const currentVal = parent ? parent[lastKey] : undefined;
      if (JSON.stringify(currentVal) !== JSON.stringify(value)) {
        throw new AppError(`Test operation failed at path '${path}'`, 400);
      }
      break;
    }

    default:
      throw new AppError(`Unsupported patch operation '${op}'`, 400);
  }
}

/**
 * Applies array of RFC 6902 patch operations to target object.
 * Returns { target, modifiedFields }
 */
function applyJsonPatch(target, patches) {
  if (!Array.isArray(patches)) {
    throw new AppError('JSON Patch payload must be an array of operation objects', 400);
  }

  const modifiedFields = new Set();

  patches.forEach((patch) => {
    if (patch && patch.path) {
      const segs = parsePointer(patch.path);
      if (segs.length > 0) {
        modifiedFields.add(segs[0].toLowerCase());
      }
    }
    applySinglePatch(target, patch);
  });

  return { target, modifiedFields };
}

module.exports = {
  applyJsonPatch,
  parsePointer,
  getValueAtPath,
};
