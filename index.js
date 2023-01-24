import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import { invoke } from "./api.js";

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
    res.json([]);
  } catch (err) {
    next(err);
  }
});

app.listen(process.env.HTTP_PORT, () => {
  console.log(`Server is running`);
});
