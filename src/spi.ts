import * as fs from 'fs';
import { Mode, Order, SpiAddon, Settings, TransferFunction } from './spi.types';
import { constraints } from './utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SpiAddon: SpiAddon = require('bindings')('spi');

export class SPI implements Settings {
  static readonly spiSupported = SpiAddon.spiSupported;

  static fromDevicePath(devicePath = '/dev/spidev0.0') {
    const fd = fs.openSync(devicePath, 'r+');
    return new SPI(fd);
  }

  static fromFileDescriptor(fd: number) {
    return new SPI(fd);
  }

  @constraints<Mode>((x) => Object.values(Mode).includes(x))
  mode: Mode = Mode.M0;

  setMode(mode: Mode) {
    this.mode = mode;
    return this;
  }

  @constraints<number>(Number.isSafeInteger, (x) => x > 0)
  speed = 4e6;

  setSpeed(speed: number) {
    this.speed = speed;
    return this;
  }

  @constraints<Order>((x) => Object.values(Order).includes(x))
  order = Order.MSB_FIRST;

  setOrder(order: Order) {
    this.order = order;
    return this;
  }

  @constraints<TransferFunction | null>((x) => x === null || typeof x === 'function')
  transferOverride: TransferFunction | null = null;

  setTransferOverride(txFn: TransferFunction) {
    this.transferOverride = txFn;
    return this;
  }

  private constructor(readonly fd: number) {}

  write(buffer: Buffer) {
    return this.transfer(buffer, 0);
  }

  read(readcount: number) {
    return this.transfer(Buffer.alloc(0), readcount);
  }

  transfer(dataIn: Buffer, readcount: number = dataIn.length): Promise<Buffer> {
    if (this.transferOverride) {
      return this.transferOverride(dataIn, readcount);
    } else {
      const config = {
        speed: this.speed,
        mode: this.mode,
        order: this.order,
        fd: this.fd,
        dataIn,
        readcount,
      };

      return new Promise<Buffer>((ok, err) =>
        SpiAddon.transfer(
          (error, dataOut) => (error ? err(error) : ok(dataOut ?? Buffer.of())),
          config,
        ),
      );
    }
  }

  close() {
    fs.closeSync(this.fd);
  }
}
