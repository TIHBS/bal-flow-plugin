import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import * as fcl from "@onflow/fcl";

fcl.config({
  "accessNode.api": process.env.FLOW_ACCESS_NODE_API,
});

// const latestBlock = await latestBlock(true);

// Get events at block height range
const res = await fcl
  .send([
    fcl.getEventsAtBlockHeightRange(
      "A.f8d6e0586b0a20c7.Example.StringUpdate", // event name
      0, // block to start looking for events at
      100 // block to stop looking for events at
    ),
  ])
  .then(fcl.decode);

console.log("res", res);

// Get events from list of block ids
// await fcl
//   .send([
//     fcl.getEventsAtBlockIds("A.7e60df042a9c0868.FlowToken.TokensWithdrawn", [
//       "c4f239d49e96d1e5fbcf1f31027a6e582e8c03fcd9954177b7723fdb03d938c7",
//       "5dbaa85922eb194a3dc463c946cc01c866f2ff2b88f3e59e21c0d8d00113273f",
//     ]),
//   ])
//   .then(fcl.decode);
