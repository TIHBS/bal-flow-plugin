import { sansPrefix, withPrefix } from "@onflow/fcl";
import { SHA3 } from "sha3";
import elliptic from "elliptic";

const curve = new elliptic.ec("p256");

const hashMessageHex = (msgHex) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msgHex, "hex"));
  return sha.digest();
};

const signWithKey = (privateKey, msgHex) => {
  const key = curve.keyFromPrivate(Buffer.from(privateKey, "hex"));
  const sig = key.sign(hashMessageHex(msgHex));
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);
  return Buffer.concat([r, s]).toString("hex");
};

const signer = async (account) => {
  const keyId = process.env.KEY_ID;
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const pkey = process.env.PRIVATE_KEY;

  return {
    ...account,
    tempId: `${accountAddress}-${keyId}`,
    addr: sansPrefix(accountAddress),
    keyId: Number(keyId),
    signingFunction: async (signable) => {
      const signature = await signWithKey(pkey, signable.message);
      return {
        addr: withPrefix(accountAddress),
        keyId: Number(keyId),
        signature,
      };
    },
  };
};

export default signer;
