const dgram = require("dgram");
const server = dgram.createSocket("udp4");

server.on("error", err => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on("listening", () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

module.exports = server;
