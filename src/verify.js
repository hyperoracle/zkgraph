import { providers, Contract } from "ethers";
import Web3EthContract from "web3-eth-contract";
import BN from "bn.js";
import {
  ZkWasmUtil,
//   ZkWasmServiceTaskHelper,
  ZkWasmServiceHelper,
} from "zkwasm-service-helper";

const resturl = "http://zkwasm-explorer.delphinuslab.com:8080";
// const zkwasmTaskHelper = new ZkWasmServiceTaskHelper(resturl, "", "");
const zkwasmHelper = new ZkWasmServiceHelper(resturl, "", "");

// https://github.com/zkcrossteam/g1024/blob/916c489fefa65ce8d4ee1a387f2bd4a3dcca8337/src/utils/proof.ts#L7
function bytesToBN(data) {
  let chunksize = 64;
  let bns = [];
  for (let i = 0; i < data.length; i += 32) {
    const chunk = data.slice(i, i + 32);
    let a = new BN(chunk, "le");
    bns.push(a);
    // do whatever
  }
  return bns;
}
function hexToBNs(hexString){
    let bytes = new Array(Math.ceil(hexString.length/16));
    for (var i = 0; i < hexString.length; i += 16) {
      bytes[i] = new BN(hexString.slice(i, Math.min(i+16, hexString.length)), 16, 'le');
    }
    return bytes;
  }

function parseArg(input) {
    let inputArray = input.split(":");
    let value = inputArray[0];
    let type = inputArray[1];
    let re1 = new RegExp(/^[0-9A-Fa-f]+$/); // hexdecimal
    let re2 = new RegExp(/^\d+$/); // decimal
  
    // Check if value is a number
    if(!(re1.test(value.slice(2)) || re2.test(value))) {
      console.log("Error: input value is not an interger number");
      return null;
    }
  
    // Convert value byte array
    if(type == "i64") {
      let v;
      if(value.slice(0, 2) == "0x") {
        v = new BN(value.slice(2), 16);
      } else {
        v = new BN(value);
      }
      return [v];
    } else if(type == "bytes" || type == "bytes-packed") {
      if(value.slice(0, 2) != "0x") {
        console.log("Error: bytes input need start with 0x");
        return null;
      }
      let bytes = hexToBNs(value.slice(2));
      return bytes;
    } else {
      console.log("Unsupported input data type: %s", type);
      return null;
    }
  }

// https://github.com/zkcrossteam/g1024/blob/916c489fefa65ce8d4ee1a387f2bd4a3dcca8337/src/data/image.ts#L95
function parseArgs(raw) {
  let parsedInputs = new Array();
  for (var input of raw) {
    input = input.trim();
    if (input !== "") {
      let args = parseArg(input);
      if (args != null) {
        parsedInputs.push(args);
      } else {
        throw Error(`invalid args in ${input}`);
      }
    }
  }
  return parsedInputs.flat();
}

// https://github.com/zkcrossteam/g1024/blob/916c489fefa65ce8d4ee1a387f2bd4a3dcca8337/src/data/image.ts#L4
const contract_abi = {
  contractName: "AggregatorVerifier",
  abi: [
    {
      inputs: [
        {
          internalType: "contract AggregatorVerifierCoreStep[]",
          name: "_steps",
          type: "address[]",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          internalType: "uint256[]",
          name: "proof",
          type: "uint256[]",
        },
        {
          internalType: "uint256[]",
          name: "verify_instance",
          type: "uint256[]",
        },
        {
          internalType: "uint256[]",
          name: "aux",
          type: "uint256[]",
        },
        {
          internalType: "uint256[][]",
          name: "target_instance",
          type: "uint256[][]",
        },
      ],
      name: "verify",
      outputs: [],
      stateMutability: "view",
      type: "function",
      constant: true,
    },
  ],
};

async function testverify() {
  let taskID = "650aa378a476965e5d8f1dba";
  let tasks = await zkwasmHelper.loadTasks({ id: taskID });
  let task = tasks.data[0];
  
  let aggregate_proof = bytesToBN(task.proof);
  let instances = bytesToBN(task.instances);
  let aux = bytesToBN(task.aux);
  let image = await zkwasmHelper.queryImage(task.md5);
  if (image.deployment.length == 0) {
    console.log("contract not deployed");
  }

  let address = image.deployment[0].address;
  console.log(address);

  let args = parseArgs(task.public_inputs).map((x) => x.toString(10));
  if (args.length == 0) {
    args = [0];
  }

  Web3EthContract.setProvider("https://rpc.ankr.com/eth_sepolia");
  let contract = new Web3EthContract(contract_abi.abi, address);
  try {
    let result = await contract.methods
      .verify(aggregate_proof, instances, aux, [args])
      .call();
  } catch (error) {
    console.log(error.message);
    console.log("verify failed");
    return;
  }

  console.log("verify success");

  //   const provider = new providers.JsonRpcProvider(
  //     "https://rpc.ankr.com/eth_goerli"
  //   );
  //   const verify_contract = new Contract(address, contract_abi.abi, provider);
  //   const result = await verify_contract.verify(aggregate_proof, instances, aux, [args]);
  //   console.log(result);
}

await testverify();
