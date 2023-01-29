import signer from "../signer.js";
import * as fcl from "@onflow/fcl";
import BigNumber from "bignumber.js";

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

    const inputTypeInfo = JSON.parse(inputs[i]["type"]);

    if (inputTypeInfo["type"] == "string") {
      temp["argType"] = `${inputs[i]["name"]}: String`;
      temp["argsName"] = `${inputs[i]["name"]}: ${inputs[i]["name"]}`;
      p2 = (arg, t) => arg(inputs[i]["value"], t.String);
    } else if (inputTypeInfo["type"] == "boolean") {
      temp["argType"] = `${inputs[i]["name"]}: Bool`;
      temp["argsName"] = `${inputs[i]["name"]}: ${inputs[i]["name"]}`;
      p2 = (arg, t) => arg(inputs[i]["value"], t.Bool);
    } else if (inputTypeInfo["type"] == "integer") {
      const dataType = handleIntegerType(inputTypeInfo);

      temp["argType"] = `${inputs[i]["name"]}: ${dataType}`;

      temp["argsName"] = `${inputs[i]["name"]}: ${inputs[i]["name"]}`;
      p2 = (arg, t) => arg(inputs[i]["value"], typeMapping(dataType, t));
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

const typeMapping = (dataType, t) => {
  const mapping = {
    UInt8: t.UInt8,
    UInt16: t.UInt16,
    UInt32: t.UInt32,
    UInt64: t.UInt64,
    UInt128: t.UInt128,
    UInt256: t.UInt256,
    Int8: t.Int8,
    Int16: t.Int16,
    Int32: t.Int32,
    Int64: t.Int64,
    Int128: t.Int128,
    Int256: t.Int256,
  };
  return mapping[dataType];
};

const handleIntegerType = (jsonObject) => {
  if (
    jsonObject.hasOwnProperty("minimum") &&
    jsonObject.hasOwnProperty("maximum")
  ) {
    let minimum = new BigNumber(jsonObject.minimum);
    let maximum = new BigNumber(jsonObject.maximum);

    if (minimum.eq(BigNumber(0))) {
      if (maximum > BigNumber(0)) {
        let m = Math.floor(Math.log2(BigNumber(maximum.plus(BigNumber(1)))));

        if (m % 8 === 0) {
          return `UInt${m}`;
        }
      }
    } else {
      if (
        minimum < BigNumber(0) &&
        minimum.abs().eq(maximum.plus(BigNumber(1)))
      ) {
        let m = Math.floor(Math.log2(BigNumber(maximum.plus(BigNumber(1)))));
        console.log("here", (m + 1) % 8);
        if ((m + 1) % 8 === 0) {
          return `Int${m + 1}`;
        }
      }
    }
  }

  throw new Error(`Unrecognized integer type ${JSON.stringify(jsonObject)}!`);
};
