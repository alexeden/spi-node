export function constraints<T>(
  ...fns: Array<(x: T) => boolean>
): PropertyDecorator {
  return (target: Record<string, unknown>, propertyName: string): void => {
    let value: T;

    Object.defineProperty(target, propertyName, {
      get() {
        return value;
      },
      set(newValue: T) {
        if (fns.every((fn) => fn(newValue))) {
          value = newValue;
        } else {
          console.warn(
            `Constraints prevented "${propertyName}" from being set to ${newValue}`,
          );
        }
      },
    });
  };
}
