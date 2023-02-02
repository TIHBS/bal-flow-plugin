import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import { invoke, queryFunctionInvocations, queryEvents } from "./apis/api.js";

const app = express();
app.use(bodyParser.json());

app.post("/invoke", async (req, res, next) => {
  try {
    const data = req.body;
    console.log("Execute called with body:", data);
    const {
      inputs,
      outputs,
      functionIdentifier,
      smartContractPath,
      signers,
      requiredConfidence,
      minimumNumberOfSignatures,
    } = data;

    const fields = smartContractPath.split("/");
    const account = fields[0];
    const contractName = fields[1];

    const txID = await invoke(
      account,
      contractName,
      functionIdentifier,
      inputs
    );
    res.json({ transactionHash: txID });
  } catch (err) {
    next(err);
  }
});

app.post("/query", async (req, res, next) => {
  try {
    const data = req.body;
    console.log("data", data);
    const smartContractPath = data["smartContractPath"];
    const functionIdentifier = data["functionIdentifier"];
    const eventIdentifier = data["eventIdentifier"];

    const filter = data["filter"];
    const timeframe = data["timeframe"];
    const parameters = data["parameters"];

    let result;
    if (functionIdentifier && functionIdentifier !== "") {
      // function invocation query

      result = await queryFunctionInvocations(
        functionIdentifier,
        filter,
        timeframe,
        parameters
      );
    } else {
      //event query
      result = await queryEvents(
        smartContractPath,
        eventIdentifier,
        filter,
        timeframe,
        parameters
      );
    }

    console.log("Query result:", JSON.stringify(result));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.listen(process.env.HTTP_PORT, () => {
  console.log(`Server is running`);
});
