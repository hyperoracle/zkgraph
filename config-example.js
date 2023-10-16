export const config = {
  // Update your Etherum JSON RPC provider URL here.
  // Recommend using Erigon node RPC.
  JsonRpcProviderUrl: {
    mainnet: "https://{URL}", // Optional
    sepolia: "https://{URL}", // Optional
    goerli: "https://{URL}", // Optional
  },
  // Update your private key here to sign zkwasm messages.
  // Please note that (during testnet phrase) your address balance (in zkwasm server) should > 0;
  UserPrivateKey: "0x{PRIVATE_KEY}",

  DispatcherContract: "0x25AA9Ec3CA462f5AEA7fbd83A207E29Df4691380",
  DispatcherQueryrApi: "https://zkwasm.hyperoracle.io/td/",
  DispatcherProviderUrl: "https://ethereum-sepolia.publicnode.com",

  ZkwasmProviderUrl: "https://zkwasm-explorer.delphinuslab.com:8090",
  CompilerServerEndpoint: "http://compiler.hyperoracle.io/compile",
  PinataEndpoint: "https://api.pinata.cloud/pinning/pinFileToIPFS",
  PinataJWT: "eyJhbGc...",

  WasmBinPath: "build/zkgraph_full.wasm",
  LocalWasmBinPath: "build/zkgraph_local.wasm",
};
