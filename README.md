# spi-node

Communicate with devices using SPI directly from your Node.js app. Supports mock data transfers on machines without SPI support for easy local development. Uses Node's now-stable [N-API](https://nodejs.org/dist/latest-v10.x/docs/api/n-api.html#n_api_n_api) for native addon support. Written in Typescript.

## Installation

To install:

```
npm install --save spi-node
```

When installing, the native binaries will be rebuilt and added to your project's `/build` directory. If installing on a machine without SPI support, you'll see this warning from the compiler:

```
warning: "SPI not supported on this machine" [-W#warnings]
```

Not a problem, you can programatically opt-in to using mock data transfers.

## API

### Package contents

The package exports the following (not including several exported type declarations):

```
import { Flags, Mode, Order, SPI } from 'spi-node';
```

#### `Flags` Enum

`Flags` is an enum of the underlying [flags used to set an SPI channel's](https://en.wikipedia.org/wiki/Serial_Peripheral_Interface#Clock_polarity_and_phase) mode. You (probably) won't need to use `Flags` directly as they're built into the values of `Mode`.

```
enum Flags {
  CPHA = 0x01,
  CPOL = 0x02
}
```

- `Flags.CPOL`: If set, sets clock polarity such that the leading edge of the clock cycle is a falling edge.
- `Flags.CPHA`: If set, data is read on the leading edge of the clock cycle.

#### `Mode` Enum

`Mode` is an enum of the [four possible SPI modes](https://en.wikipedia.org/wiki/Serial_Peripheral_Interface#Mode_numbers), which are just permutations of the `Flags`.

```
enum Mode {
  M0 =	0 | 0,
  M1 =	0 | Flags.CPHA,
  M2 =	Flags.CPOL | 0,
  M3 =	Flags.CPOL | Flags.CPHA,
}
```

> **The default `mode` of an `SPI` instance is `Mode.M0`.**

#### `Order` Enum

`Order` is an enum whose values set the bit order of data transferred over an SPI connection.

```
enum Order {
  MSB_FIRST = 0,
  LSB_FIRST = 1,
}
```

> **The default `order` of an `SPI` instance is `Order.MSB_FIRST`.**
