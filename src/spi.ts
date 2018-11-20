import * as fs from 'fs';
import { Mode, Order, SpiAddon } from './spi.types';
import { constraints } from './utils';

// tslint:disable-next-line:no-var-requires
const SpiAddon: SpiAddon = require('bindings')('spi');

export class SPI {
  static readonly spiSupported = SpiAddon.spiSupported;

  private fd: number;

  @constraints(x => Object.values(Mode).includes(x))
  mode: Mode = 0;

  @constraints(Number.isSafeInteger, x => x > 0)
  speed = 4e6;

  @constraints(x => Object.values(Order).includes(x))
  order: Order = Order.MSB_FIRST;

  constructor(
    readonly devicePath = '/dev/null'
  ) {
    this.fd = fs.openSync(this.devicePath, 'r+');
  }

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
