export function constraints(
  ...fns: Array<(x: any) => boolean>
): PropertyDecorator {
  return (target: {}, propertyName: string): void => {
    let value: any;

    Object.defineProperty(target, propertyName, {
      get() {
        return value;
      },
      set(newValue: any) {
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
