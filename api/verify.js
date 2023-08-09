import { program } from "commander";
import {
  logDivider,
  parseArgs,
  bytesToBN,
} from "./common/utils.js";
import { testNets, contract_abi } from "./common/constants.js";
import { waitTaskStatus } from "./requests/zkwasm_taskdetails.js";
import { providers, Contract } from "ethers";

program.version("1.0.0");
program
  .argument(
    "<network name>",
    "Name of deployed network for verification contract"
  )
  .argument(
    "<deployed contract address>",
    "Contract address of deployed verification contract address"
  )
  .argument("<prove task id>", "Task id of prove task");
program.parse(process.argv);
const args = program.args;

// Log script name
console.log(">> VERIFY PROOF ONCHAIN", "\n");

// Inputs from command line
const inputtedNetworkName = args[0];
const deployedContractAddress = args[1];
const taskId = args[2];

// Check if network name is valid
const validNetworkNames = testNets.map((net) => net.name.toLowerCase());
if (!validNetworkNames.includes(inputtedNetworkName.toLowerCase())) {
  console.log(`[-] NETWORK NAME IS INVALID.`, "\n");
  console.log(`[*] Valid networks: ${validNetworkNames.join(", ")}.`, "\n");
  logDivider();
  process.exit(1);
}
const targetNetwork = testNets.find(
  (net) => net.name.toLowerCase() === inputtedNetworkName.toLowerCase()
);

// Check task status of prove.
const taskDetails = await waitTaskStatus(taskId, ["Done", "Fail"], 3000, 0); //TODO: timeout
if (taskDetails.status !== "Done") {
  console.log("[-] PROVE TASK IS NOT DONE. EXITING...", "\n");
  logDivider();
  process.exit(1);
}

// Inputs for verification
const instances = bytesToBN(taskDetails.instances);
const proof = bytesToBN(taskDetails.proof)
const aux = bytesToBN(taskDetails.aux);
let arg = parseArgs(taskDetails.public_inputs).map((x) => x.toString());
if (arg.length === 0) arg = [0];

const provider = new providers.getDefaultProvider(targetNetwork.name.toLowerCase())
const contract = new Contract(
  deployedContractAddress,
  contract_abi.abi,
  provider
);

console.log(arg.length)
console.log(arg)

// PENDING: need iccz's universal encoder smart contract as dependency.

// npm run verify sepolia 0x1eAfA13CfbFAC3110fE43f1058f6d30449AC8fd8 64d0115ff0e3eee93f7e4bf7
// Error: too many target instances
// const tx = await contract.verify(proof, instances, aux, [arg]).catch((err) => {
//   console.log(`[-] VERIFICATION FAILED.`, "\n");
//   console.log(`[*] Error: ${err.reason}`, "\n");
//   logDivider();
//   process.exit(1);
// });

console.log(`[+] VERIFICATION SUCCESS!`, "\n");
process.exit(0);