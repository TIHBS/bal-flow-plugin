import { config, query, mutate, tx, send } from "@onflow/fcl";
import signer from "./signer.js";

export const invoke = async (account, contractName, functionName, inputs) => {
  config({
    "accessNode.api": process.env.FLOW_ACCESS_NODE_API,
  });

  const proposer = signer;

  const template = getTransaction(account, contractName, functionName, inputs);

  const { p } = parseInputs(inputs);
  const payer = signer;
  const authorizations = [signer];
  const transactionId = await mutate({
    cadence: template,
    args: (arg, t) => p.map((e) => e(arg, t)),
    proposer: proposer,
    payer: payer,
    authorizations,
    limit: 999,
  });

  const transaction = await tx(transactionId).onceSealed();
  console.log(transaction);
  return transactionId;
};

const getTransaction = (account, contractName, functionName, inputs) => {
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
