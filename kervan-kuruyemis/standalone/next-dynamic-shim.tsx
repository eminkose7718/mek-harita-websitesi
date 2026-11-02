// Replaces next/dynamic in the single-file build.
import { lazy, Suspense, type ComponentType } from "react";

export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>) {
  const L = lazy(loader);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={null}>
        <L {...props} />
      </Suspense>
    );
  };
}
