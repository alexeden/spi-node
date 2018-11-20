const { SPI } = require('../dist');

const spi = new SPI();

console.log(SPI);
console.log(spi);

console.log(spi.clockSpeed);
spi.clockSpeed = 1;
console.log(spi.clockSpeed);
spi.clockSpeed = -2;
console.log(spi.clockSpeed);
