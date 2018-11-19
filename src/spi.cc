#include <cstdlib>
#include <algorithm>
#include <iostream>
#include <sstream>
#include <stdexcept>

#include <napi.h>
#include "utils.cc"

#if __linux__
#include <sys/ioctl.h>
#include <linux/spi/spidev.h>
#endif

#ifndef SPI_IOC_MESSAGE
	// Disable some diagnostics and issue a compiler warning
	#pragma GCC diagnostic ignored "-Wunused-private-field"
	#pragma GCC diagnostic ignored "-Wunused-variable"
	#ifdef __GNUC__
		#warning "Building without SPI support"
	#elif
		#pragma message("Building without SPI support")
	#endif

	// Define an SPI support flag
	#define SPI_SUPPORTED false

	// Copied from https://github.com/torvalds/linux/blob/master/include/uapi/linux/spi/spidev.h
	#define SPI_CPHA		0x01
	#define SPI_CPOL		0x02

	#define SPI_MODE_0		(0|0)
	#define SPI_MODE_1		(0|SPI_CPHA)
	#define SPI_MODE_2		(SPI_CPOL|0)
	#define SPI_MODE_3		(SPI_CPOL|SPI_CPHA)
#else
	// Define an SPI support flag
	#define SPI_SUPPORTED true
#endif

class SpiTransfer : public Napi::AsyncWorker {
private:
	int fd;
	uint32_t speed;
	uint8_t mode;
	uint8_t order;
	uint32_t readcount;
	size_t buflen;
	uint8_t* buffer;

public:
	SpiTransfer(
		Napi::Function& cb,
		int fd,
		uint32_t speed,
		uint8_t mode,
		uint8_t order,
		Napi::Buffer<uint8_t> dataIn,
		size_t readcount
	): 	AsyncWorker(cb),
		fd(fd),
		speed(speed),
		mode(mode),
		order(order),
		readcount(readcount)
	{
		size_t writecount = dataIn.Length();
		buflen = std::max(writecount, readcount);
		buffer = (uint8_t*) malloc(buflen);
		memcpy(buffer, dataIn.Data(), writecount);
		memset(buffer + writecount, 0, readcount >= writecount ? readcount - writecount : 0);
	}

	~SpiTransfer() {
		free(buffer);
	}

	void Execute() {
	#ifdef SPI_IOC_MESSAGE
		if (ioctl(fd, SPI_IOC_WR_MODE, &mode) == -1) {
			throw std::runtime_error("Failed to set the SPI mode.");
		}

		if (ioctl(fd, SPI_IOC_WR_LSB_FIRST, &order) == -1) {
			throw std::runtime_error("Failed to set the SPI bit order.");
		}

		spi_ioc_transfer msg({
			.tx_buf = (uintptr_t)buffer,
			.rx_buf = (uintptr_t)buffer,
			.len = buflen,
			.speed_hz = speed,
		});

		if (ioctl(fd, SPI_IOC_MESSAGE(1), &msg) == -1) {
			throw std::runtime_error("SPI message transfer failed.");
		}
	#else
		throw std::runtime_error("SPI is not supported on this machine.");
	#endif
	}

	void OnOK() {
		Napi::HandleScope scope(Env());
		Napi::Buffer<u_int8_t> dataOut = Napi::Buffer<uint8_t>::New(scope.Env(), buffer, buflen);
		Callback().Call({ scope.Env().Null(), dataOut });
	}

	void OnError(const Napi::Error& e) {
		Napi::HandleScope scope(Env());
		Callback().Call({ e.Value(), Env().Null() });
	}
};

Napi::Object ReadSpiSettings(const Napi::CallbackInfo& info) {
	auto env = info.Env();
	if (!info[0].IsNumber()) throw Napi::Error::New(env, "readSpiSettings expects a file descriptor as its argument!");
	auto fd = info[0].As<Napi::Number>().Uint32Value();
	auto settings = Napi::Object::New(env);
	settings.Set("mode", env.Null());
	settings.Set("order", env.Null());
	settings.Set("bitsPerWord", env.Null());
	settings.Set("speed", env.Null());

	#ifdef SPI_IOC_MESSAGE
		uint8_t order, bits;
		uint32_t mode, speed;
		ioctl(fd, SPI_IOC_RD_MODE32, &mode);
		ioctl(fd, SPI_IOC_RD_LSB_FIRST, &order);
		ioctl(fd, SPI_IOC_RD_BITS_PER_WORD, &bits);
		ioctl(fd, SPI_IOC_RD_MAX_SPEED_HZ, &speed);
		settings.Set("mode", Napi::Number::New(env, mode));
		settings.Set("order", Napi::Number::New(env, order));
		settings.Set("bitsPerWord", Napi::Number::New(env, bits));
		settings.Set("speed", Napi::Number::New(env, speed));
	#endif

	return settings;
}

Napi::Value Transfer(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	// Check the arguments and their types
	if (!info[0].IsFunction()) throw Napi::Error::New(env, "The first argument of the SPI transfer method must be a callback function!");
	if (!info[1].IsObject()) throw Napi::Error::New(env, "The second argument of the SPI transfer method must be a config object!");
	auto cb = info[0].As<Napi::Function>();
	auto config = info[1].As<Napi::Object>();

	// Validate the config properties and initialize a transfer worker
	SpiTransfer *worker = new SpiTransfer(
	/* cb */		cb,
	/* fd */		NapiUtils::getNumberProp(env, config, "fd").Int32Value(),
	/* speed */		NapiUtils::getNumberProp(env, config, "speed").Uint32Value(),
	/* mode */		(uint8_t) NapiUtils::getNumberProp(env, config, "mode").Uint32Value(),
	/* order */		(uint8_t) NapiUtils::getNumberProp(env, config, "order").Uint32Value(),
	/* buffer */	NapiUtils::getBufferProp<uint8_t>(env, config, "dataIn"),
	/* readcount */	(size_t) NapiUtils::getNumberProp(env, config, "readcount").Uint32Value()
	);
	worker->Queue();
	return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
	Napi::Object modes = Napi::Object::New(env);
	modes.Set("SPI_MODE_0", SPI_MODE_0);
	modes.Set("SPI_MODE_1", SPI_MODE_1);
	modes.Set("SPI_MODE_2", SPI_MODE_2);
	modes.Set("SPI_MODE_3", SPI_MODE_3);
	exports.Set("modes", modes);
	exports.Set("spiSupported", Napi::Boolean::New(env, SPI_SUPPORTED));
	exports.Set("transfer", Napi::Function::New(env, Transfer));
	exports.Set("readSpiSettings", Napi::Function::New(env, ReadSpiSettings));
	return exports;
}

NODE_API_MODULE(hello, Init)
