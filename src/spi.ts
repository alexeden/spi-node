import * as fs from 'fs';
import { Mode, Order, SpiAddon } from './spi.types';

// tslint:disable-next-line:no-var-requires
const SpiAddon: SpiAddon = require('bindings')('spi');

export class SPI {
  private fd: number;

  constructor(
    readonly devicePath: string,
    readonly clockSpeed: number = 4e6,
    readonly dataMode: Mode = 0,
    readonly bitOrder: Order = Order.MSB_FIRST
  ) {
    this.fd = fs.openSync(this.devicePath, 'r+');
  }

  get config() {
    return {
      fd: this.fd,
      speed: this.clockSpeed,
      mode: this.dataMode,
      order: this.bitOrder,
    };
  }

  private ffiTransfer(dataIn: Buffer, readcount: number): Promise<Buffer> {
    return new Promise<Buffer>((ok, err) => {
      SpiAddon.transfer(
        (error, dataOut) => error ? err(error) : ok(dataOut!),
        { ...this.config, dataIn, readcount }
      );
    });
  }

  write(buffer: Buffer) {
    return this.ffiTransfer(buffer, 0);
  }

  read(readcount: number) {
    return this.ffiTransfer(Buffer.alloc(0), readcount);
  }

  transfer(buffer: Buffer, readcount: number = buffer.length) {
    return this.ffiTransfer(buffer, readcount);
  }

  close() {
    fs.closeSync(this.fd);
  }
}
