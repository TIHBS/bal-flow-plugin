const txd = await send([
  getTransaction(
    "1f440ed43600ea4adce428c18273918cc23be6a9833b6ba6ae0bdeae1b03da0c"
  ),
]).then(decode);

console.log(txd);
