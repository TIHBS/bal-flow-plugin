import * as fcl from "@onflow/fcl";
import { compileExpression } from "filtrex";

export const queryEvents = async (
  smartContractPath,
  eventIdentifier,
  filter,
  timeframe,
  parameters
) => {
  fcl.config({
    "accessNode.api": process.env.FLOW_ACCESS_NODE_API,
  });

  const { from, to } = await calculateBlockRange(
    timeframe["from"],
    timeframe["to"]
  );

  console.log(`Finding events in block range [${from}:${to}]`);

  const fields = smartContractPath.split("/");
  const account = fields[0];
  const contractName = fields[1];

  const result = await getEventsInBlockRange(
    account,
    contractName,
    eventIdentifier,
    from,
    to
  );

  const transformedResult = transFromQueryResult(result);
  const filteredResult = applyFilter(transformedResult, filter);
  return filteredResult;
};

const applyFilter = (data, filter) => {
  const f = compileExpression(filter);
  const filteredResult = [];
  for (let i = 0; i < data.length; i++) {
    let parameters = data[i]["parameters"];
    for (let j = 0; j < parameters.length; j++) {
      console.log(parameters[j], f(parameters[j]));
      if (f(parameters[j])) {
        filteredResult.push(data[i]);
      }
    }
  }

  return filteredResult;
};

export const getEventsInBlockRange = async (
  account,
  contractName,
  eventIdentifier,
  fromBlock,
  toBlock
) => {
  let res = [];

  // FCL allows only query in range of 250 blocks
  for (let i = fromBlock; i < toBlock; i = i + 249) {
    const upto = Math.min(i + 249, toBlock);
    const temp = await fcl
      .send([
        fcl.getEventsAtBlockHeightRange(
          `A.${account}.${contractName}.${eventIdentifier}`, // event name
          i, // block to start looking for events at
          upto // block to stop looking for events at
        ),
      ])
      .then(fcl.decode);

    console.log(
      `Fetched events in range:${i} to ${upto}. Found [${temp.length}]`
    );

    res = res.concat(temp);
  }

  return res;
};

const calculateBlockRange = async (startTime, endTime) => {
  const latestSealedBlock = await fcl
    .send([
      fcl.getBlock(true), // isSealed = true
    ])
    .then(fcl.decode);

  let blockHeightEnd = latestSealedBlock["height"];

  const endBlock = await binarySearch(endTime, 1, blockHeightEnd);
  const startBlock = await binarySearch(startTime, 1, blockHeightEnd);
  return { from: startBlock, to: endBlock };
};

const getBlockTimestamp = async (blockNumber) => {
  const latestSealedBlock = await fcl.block({ height: blockNumber });
  return Math.ceil(new Date(latestSealedBlock["timestamp"]).getTime() / 1000);
};

const transFromQueryResult = (rawResult) => {
  let result = [];
  for (let i = 0; i < rawResult.length; i++) {
    const keys = Object.keys(rawResult[i]["data"]);
    const parameters = [];

    for (let j = 0; j < keys.length; j++) {
      parameters.push({
        name: keys[j],
        value: rawResult[i]["data"][keys[j]],
        type: "string",
      });
    }

    result.push({
      isoTimestamp: new Date(rawResult[i]["blockTimestamp"]).toISOString(),
      parameters: parameters,
    });
  }
  return result;
};

const binarySearch = async (target, lo, hi) => {
  const low = await getBlockTimestamp(lo);
  const high = await getBlockTimestamp(hi);

  if (target < low) {
    return 0;
  }
  if (target > high) {
    return hi;
  }

  const mid = Math.floor((hi + lo) / 2);
  const midVal = await getBlockTimestamp(mid);
  return hi - lo < 2
    ? target - low < high - target
      ? lo
      : hi
    : target < midVal
    ? binarySearch(target, lo, mid)
    : target > midVal
    ? binarySearch(target, mid, hi)
    : mid;
};

export const queryFunctionInvocations = async (
  functionIdentifier,
  filter,
  timeframe,
  parameters
) => {};
