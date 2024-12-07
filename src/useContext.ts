import Context from "./Context";

export default function useContext<T>(context: Context<T>): T {
  return context.get();
}