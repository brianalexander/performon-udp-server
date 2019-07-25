const server = require("./config/server");
const amqp = require("amqplib/callback_api");

const { handleDeviceData, handleMetrics } = require("./controller/controller");
const { DATABASE_EXCHANGE, LIVE_DATA_EXCHANGE } = require("./config/rabbitmq");

const AMQP_CONNECTION_URI = process.env.AMQP_CONNECTION_URI;

amqp.connect(AMQP_CONNECTION_URI, (error0, connection) => {
  if (error0) {
    throw error0;
  }

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw errow1;
    }

    channel.assertExchange(DATABASE_EXCHANGE, "topic", { durable: false });
    channel.assertExchange(LIVE_DATA_EXCHANGE, "topic", {
      durable: false
    });

    // Forward message to appropriate topics when received
    server.on("message", async (msg, rinfo) => {
      const { contentType, payload } = JSON.parse(msg);
      if (contentType === "metrics") {
        await handleMetrics(channel, payload, msg, rinfo);
      } else {
        await handleDeviceData(payload);
      }
    });
  });
});

module.exports = server;
