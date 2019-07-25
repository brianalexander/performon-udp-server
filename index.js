require("dotenv").config();

const server = require("./src/app");

const port = process.env.PORT;

server.bind(port);
