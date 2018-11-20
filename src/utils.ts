type Constraint = <T>(x: T) => boolean;

export function constraints(...fns: Constraint[]) {
  return <T>(target: {}, propertyName: keyof T): void => {
    let value: any;

    Object.defineProperty(target, propertyName, {
      get() {
        return value;
      },
      set(newValue: any) {
        if (fns.every(fn => fn(newValue))) {
          value = newValue;
        }
      },
    });
  };
};
