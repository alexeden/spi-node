import * as fs from 'fs';
import { Mode, Order, SpiAddon, Settings, TransferFunction } from './spi.types';
import { constraints } from './utils';

// tslint:disable-next-line:no-var-requires
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

  @constraints(x => Object.values(Mode).includes(x))
  mode: Mode = Mode.M0;
  setMode(mode: Mode) {
    this.mode = mode;
    return this;
  }

  @constraints(Number.isSafeInteger, x => x > 0)
  speed = 4e6;
  setSpeed(speed: number) {
    this.speed = speed;
    return this;
  }

  @constraints(x => Object.values(Order).includes(x))
  order: Order = Order.MSB_FIRST;
  setOrder(order: Order) {
    this.order = order;
    return this;
  }

  @constraints(x => x === null || typeof x === 'function')
  transferOverride: TransferFunction | null = null;
  setTransferOverride(txFn: TransferFunction) {
    this.transferOverride = txFn;
    return this;
  }

  private constructor(
    readonly fd: number
  ) {}

  write(buffer: Buffer) {
    return this.transfer(buffer, 0);
  }

  read(readcount: number) {
    return this.transfer(Buffer.alloc(0), readcount);
  }

  transfer(dataIn: Buffer, readcount: number = dataIn.length) {
    return new Promise<Buffer>((ok, err) => {
      SpiAddon.transfer(
        (error, dataOut) => error ? err(error) : ok(dataOut!),
        {
          fd: this.fd,
          speed: this.speed,
          mode: this.mode,
          order: this.order,
          dataIn,
          readcount,
        }
      );
    });
  }

  close() {
    fs.closeSync(this.fd);
  }
}
