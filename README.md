# spi-node

Communicate with devices using [SPI](https://en.wikipedia.org/wiki/Serial_Peripheral_Interface) directly from your Node.js app. Data transfers are executed asynchronously in their own thread. Supports mock data transfers on machines without SPI support for easy local development. Uses Node's now-stable [N-API](https://nodejs.org/dist/latest-v10.x/docs/api/n-api.html#n_api_n_api) for native addon support. Written in Typescript.

## Installation

To install:

```
npm install --save spi-node
```

When installing, the native binaries will be rebuilt and added to your project's `/build` directory. If installing on a machine without SPI support, you'll see this warning from the compiler:

```
warning: "SPI not supported on this machine" [-W#warnings]
```

Not a problem, you can programatically opt-in to using mock data transfers by overriding the underlying transfer function.

## Usage

[TODO: Add MCP3008 example]

# API

The `spi-node` package exports the following:

```
import {
  Flags,
  Mode,
  Order,
  SPI,
  Settings,         // TS type
  SpiAddon          // TS type
  TransferCallback, // TS type
  TransferConfig,   // TS type
  TransferFunction, // TS type
} from 'spi-node';
```

## `Flags` Enum

`Flags` is an enum of the underlying [flags used to set an SPI channel's](https://en.wikipedia.org/wiki/Serial_Peripheral_Interface#Clock_polarity_and_phase) mode. You (probably) won't need to use `Flags` directly as they're built into the values of `Mode`.

```
enum Flags {
  CPHA = 0x01,
  CPOL = 0x02
}
```

- `Flags.CPOL`: If set, sets clock polarity such that the leading edge of the clock cycle is a falling edge.
- `Flags.CPHA`: If set, data is read on the leading edge of the clock cycle.

## `Mode` Enum

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

## `Order` Enum

`Order` is an enum whose values set the bit order of data transferred over an SPI connection.

```
enum Order {
  MSB_FIRST = 0,
  LSB_FIRST = 1,
}
```

> **The default `order` of an `SPI` instance is `Order.MSB_FIRST`.**

## `SPI` Class [TODO]

### Static properties & constructors

##### Property `SPI.spiSupported: boolean`

...

##### Constructor `SPI.fromDevicePath(path: string)`

...

##### Constructor `SPI.fromFileDescriptor(fd: number)`

...

---

### Properties

##### `mode: Mode`

...

##### `speed: number`

...

##### `order: Order`

...

##### `mode: Mode`

...

##### `transferOverride: TransferFunction | null`

...

---

### Methods

##### `write(dataIn: Buffer): Promise<Buffer>`

...

##### `read(readcount: number): Promise<Buffer>`

...

##### `transfer(dataIn: Buffer, readcount: number): Promise<Buffer>`

...


##### `close(): void`

...

---

### Chainable setter methods

All of the properties of an `SPI` instance can be set using chainable setter methods, allowing you to instantiate and configure an `SPI` connection in one go:

```
const spi = SPI.fromDevicePath('/dev/spidev0.0)
  .setMode(Mode.M0)
  .setOrder(Order.MSB_FIRST)
  .setSpeed(1e7)
  .setTransferOverride(dataIn => Promise.resolve(dataIn)); // jumper MISO/MOSI
```
