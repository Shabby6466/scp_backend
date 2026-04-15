/**
 * Returns a proxy that binds every resolved method to the original instance so
 * callers can hold plain function bags without losing `this` when splitting modules.
 */
export function createServiceFunctions<T extends object>(instance: T): T {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (prop === 'constructor') {
        return Reflect.get(target, prop, receiver);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  }) as T;
}
