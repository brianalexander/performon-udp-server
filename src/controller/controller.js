const axios = require("axios");
const { Minutes, Seconds } = require("../utils/time");
const Timeout = setTimeout(function() {}, 0).constructor;

const {
  DATABASE_EXCHANGE,
  LIVE_DATA_EXCHANGE,
  createRoutingKey
} = require("../config/rabbitmq");

const inactiveTimeoutDict = {};
const writeToDatabaseTimeoutDict = {};

async function handleDeviceData(payload) {
  // write to database only
  try {
    const { userUUID, deviceHash, ...deviceData } = payload;
    console.log(payload);

    const response = await axios.put(
      `http://localhost:9090/v1/devices/${deviceHash}`,
      deviceData
    );
    if (response.status === 200) {
      console.log("Device data updated in the database");
    } else {
      throw Error("Device data not updated.");
    }
  } catch (err) {
    console.log(err);
  }
}

function handleMetrics(channel, payload, msg, rinfo) {
  // write to database, then send to rabbitmq
  const { userUUID, deviceHash, ...metrics } = payload;
  if (writeToDatabaseTimeoutDict[userUUID + deviceHash] === undefined) {
    writeToDatabaseTimeoutDict[userUUID + deviceHash] = setTimeout(() => {
      // send data to database
      const databaseKey = createRoutingKey("live", "database", "post_device");
      console.log(
        "Forwarding data to topic",
        databaseKey,
        "on",
        DATABASE_EXCHANGE
      );
      channel.publish(DATABASE_EXCHANGE, databaseKey, msg);

      // reset timeout back to null
      writeToDatabaseTimeoutDict[userUUID + deviceHash] = undefined;
    }, Seconds(5).asMilliseconds());
  }

  // clear timeout if fresh data is received from device
  if (inactiveTimeoutDict[userUUID + deviceHash] instanceof Timeout) {
    clearTimeout(inactiveTimeoutDict[userUUID + deviceHash]);
  }

  // start timeout, report inactive if no data is received for
  // 10 seconds
  inactiveTimeoutDict[userUUID + deviceHash] = setTimeout(() => {
    console.log(
      `${userUUID}'s device ${deviceHash} on ${rinfo.address}:${
        rinfo.port
      } has gone offline.`
    );
    const inactiveKey = ["inactive", userUUID, deviceHash].join(".");
    channel.publish(LIVE_DATA_EXCHANGE, inactiveKey, Buffer.from([1]));
  }, Seconds(10).asMilliseconds());

  const liveKey = createRoutingKey("live", "http", "broadcast", userUUID);
  console.log("Forwarding data to topic", liveKey, "on", LIVE_DATA_EXCHANGE);
  console.log(payload);
  channel.publish(
    LIVE_DATA_EXCHANGE,
    liveKey,
    Buffer.from(JSON.stringify(payload))
  );
}

module.exports = {
  handleDeviceData,
  handleMetrics
};
