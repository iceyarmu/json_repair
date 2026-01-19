export class ObjectComparer {
  /**
   * Recursively compares two objects and ensures that:
   * - Their types match
   * - Their keys/structure match
   */
  static isSameObject(obj1: any, obj2: any): boolean {
    // Fail immediately if the types don't match
    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }

    if (typeof obj1 === 'object' && !Array.isArray(obj1)) {
      // Check that both are objects and same length
      if (typeof obj2 !== 'object' || Array.isArray(obj2)) {
        return false;
      }
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) {
        return false;
      }
      for (const key of keys1) {
        if (!(key in obj2)) {
          return false;
        }
        // Recursively compare each value
        if (!ObjectComparer.isSameObject(obj1[key], obj2[key])) {
          return false;
        }
      }
      return true;
    } else if (Array.isArray(obj1)) {
      // Check that both are arrays and same length
      if (!Array.isArray(obj2) || obj1.length !== obj2.length) {
        return false;
      }
      // Recursively compare each item
      return obj1.every((item, i) => ObjectComparer.isSameObject(item, obj2[i]));
    }

    // For atomic values: types already match, so return true
    return true;
  }

  /**
   * Returns true if value is an empty container (string, array, object, set).
   * Returns false for non-containers like null, 0, false, etc.
   */
  static isStrictlyEmpty(value: any): boolean {
    if (typeof value === 'string') {
      return value.length === 0;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length === 0;
    }
    if (value instanceof Set) {
      return value.size === 0;
    }
    return false;
  }
}
