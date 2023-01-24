import signer from "./signer.js";
import * as fcl from "@onflow/fcl";

export const invoke = async (account, contractName, functionName, inputs) => {
  fcl.config({
    "accessNode.api": process.env.FLOW_ACCESS_NODE_API,
  });

  const proposer = signer;

  const template = getTransactionString(
    account,
    contractName,
    functionName,
    inputs
  );

  const { p } = parseInputs(inputs);
  const payer = signer;
  const authorizations = [signer];
  const transactionId = await fcl.mutate({
    cadence: template,
    args: (arg, t) => p.map((e) => e(arg, t)),
    proposer: proposer,
    payer: payer,
    authorizations,
    limit: 999,
  });

  const transaction = await fcl.tx(transactionId).onceSealed();
  console.log(transaction);
  return transactionId;
};

const getTransactionString = (account, contractName, functionName, inputs) => {
  const { argsString, argsName } = parseInputs(inputs);

  const txString = `import ${contractName} from ${account}
    transaction (${argsString}) {
        prepare(acct: AuthAccount) {
        }
    
        // In execute, we log a string to confirm that the transaction executed successfully.
        execute {
           let r = ${contractName}.${functionName}(${argsName});
           log(r);
        }
    }`;

  console.log(txString);

  return txString;
};

const parseInputs = (inputs) => {
  let result = [];
  let p = [];

  for (let i = 0; i < inputs.length; i++) {
    let temp = {};
    let p2 = undefined;

    if (inputs[i]["type"] == "string") {
      temp["argType"] = `${inputs[i]["name"]}: String`;
      temp["argsName"] = `${inputs[i]["name"]}: ${inputs[i]["name"]}`;
      p2 = (arg, t) => arg(inputs[i]["value"], t.String);
    }
    result.push(temp);
    p.push(p2);
  }

  return {
    result,
    argsString: result.map((e) => e["argType"]).join(", "),
    argsName: result.map((e) => e["argsName"]).join(", "),
    p: p,
  };
};

export const queryFunctionInvocations = async (
  functionIdentifier,
  filter,
  timeframe,
  parameters
) => {};

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

  const fields = smartContractPath.split("/");
  const account = fields[0];
  const contractName = fields[1];
  const res = await fcl
    .send([
      fcl.getEventsAtBlockHeightRange(
        `A.${account}.${contractName}.${eventIdentifier}`, // event name
        0, // block to start looking for events at
        100 // block to stop looking for events at
      ),
    ])
    .then(fcl.decode);

  return transFromQueryResult(res);
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
