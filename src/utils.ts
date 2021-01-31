export function constraints<T>(
  ...fns: Array<(x: T) => boolean>
): PropertyDecorator {
  return (target, propertyName): void => {
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
            `Constraints prevented "${String(propertyName)}" from being set to ${newValue}`,
          );
        }
      },
    });
  };
}
