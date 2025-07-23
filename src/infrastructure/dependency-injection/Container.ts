export class Container {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();
  private lazyResolvers = new Map<string, () => any>();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  registerSingleton<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
    this.singletons.set(name, null);
  }

  registerLazy<T>(name: string, resolver: () => T): void {
    this.lazyResolvers.set(name, resolver);
  }

  resolve<T>(name: string): T {
    // Check lazy resolvers first
    if (this.lazyResolvers.has(name)) {
      const resolver = this.lazyResolvers.get(name);
      if (resolver) {
        return resolver();
      }
    }

    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    // Check if it's a singleton
    if (this.singletons.has(name)) {
      if (this.singletons.get(name) === null) {
        this.singletons.set(name, factory());
      }
      return this.singletons.get(name);
    }

    return factory();
  }

  has(name: string): boolean {
    return this.services.has(name) || this.lazyResolvers.has(name);
  }
}
