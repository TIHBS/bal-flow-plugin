const parseInputs = (inputs) => {
  let result = [];
  let argString = "";

  for (let i = 0; i < inputs.length; i++) {
    let temp = {};

    if (inputs[i]["type"] == "string") {
      temp["arg"] = `${inputs[i]["name"]}: String`;
    }
    result.push(temp);
  }

  return { result, argString: result.map((e) => e["arg"]).join(", ") };
};

const inputs = [
  { name: "name", type: "string", value: "Example NFT" },
  { name: "description", type: "string", value: "An NFT created for testing" },
  {
    name: "ipfs",
    type: "string",
    value: "ipfs://bafkreibngqhl3gaa7daob4i2vccziay2jjlp435cf66vhono7nrvww53ty",
  },
];

console.log(parseInputs(inputs));
