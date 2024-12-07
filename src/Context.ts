import { AsyncLocalStorage } from 'node:async_hooks';

export default class Context<T> {
  private asyncLocalStorage: AsyncLocalStorage<T>;
  private defaultValue: T;

  constructor(defaultValue: T) {
    this.asyncLocalStorage = new AsyncLocalStorage<T>();
    this.defaultValue = defaultValue;
  }

  run<TReturn>(value: T, fn: () => TReturn | Promise<TReturn>): TReturn | Promise<TReturn> {
    return this.asyncLocalStorage.run(value, fn);
  }

  get(): T {
    return this.asyncLocalStorage.getStore() ?? this.defaultValue;
  }
}