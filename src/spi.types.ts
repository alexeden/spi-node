export enum Flags {
  CPHA = 0x01,
  CPOL = 0x02,
}

export enum Mode {
  M0 = 0 | 0,
  M1 = 0 | Flags.CPHA,
  M2 = Flags.CPOL | 0,
  M3 = Flags.CPOL | Flags.CPHA,
}

export enum Order {
  MSB_FIRST = 0,
  LSB_FIRST = 1,
}

export type Settings = {
  mode: Mode;
  order: Order;
  speed: number;
};

export interface TransferConfig extends Settings {
  fd: number;
  dataIn: Buffer;
  readcount: number;
}

export type TransferFunction = (
  dataIn: Buffer,
  readcount: number,
) => Promise<Buffer>;

export type TransferCallback = (
  error: Error | null,
  dataOut: Buffer | null,
) => void;

export interface SpiAddon {
  modes: { [mode: string]: number };
  spiSupported: boolean;
  // readSpiSettings(fd: number): Settings;
  transfer(cb: TransferCallback, config: TransferConfig): void;
}
