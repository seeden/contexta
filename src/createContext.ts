import Context from './Context';

export default function createContext<T>(defaultValue: T) {
  return new Context<T>(defaultValue);
}