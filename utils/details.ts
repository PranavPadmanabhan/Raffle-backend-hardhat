import { ethers, network } from "hardhat";
import { Raffle } from "./../typechain-types/contracts/Raffle";
import "dotenv/config";
import fs from "fs";
import path from "path";

const FRONTEND_CONTRACT_ADDRESS_FILE =
  "../../solidity tutorial/frontend/raffle/constants/contractAddresses.json";
const FRONTEND_ABI_FILE =
  "../../solidity tutorial/frontend/raffle/constants/abi.json";

const chainId = network.config.chainId!.toString() === "5" ? "5" : "31337";

const getChainId = (chainId: any) => {
  switch (chainId) {
    case 31337 || "31337":
      return "31337";
    case 5 || "5":
      return "5";

    default:
      return "31337";
  }
};

async function updateABI(abi: any) {
  // const raffle: Raffle = await ethers.getContract("Raffle");

  fs.writeFileSync(FRONTEND_ABI_FILE, JSON.stringify(abi));
}

async function updateContractAddresses(raffle: any) {
  // const raffle: Raffle = await ethers.getContract("Raffle");
  console.log(chainId);
  const file = fs.readFileSync(FRONTEND_CONTRACT_ADDRESS_FILE, "utf8");
  const currentContractAddresses = JSON.parse(file);
  if (chainId in currentContractAddresses) {
    if (!currentContractAddresses[chainId].includes(raffle.address)) {
      currentContractAddresses[chainId].push(raffle.address);
    }
  } else {
    currentContractAddresses[chainId] = [raffle.address];
  }
  fs.writeFileSync(
    FRONTEND_CONTRACT_ADDRESS_FILE,
    JSON.stringify(currentContractAddresses)
  );
}

export { updateABI, updateContractAddresses };
// module.exports = async () => {
//   if (process.env.UPDATE_FRONTEND) {
//     console.log("Updating frontend...");
//     updateContractAddresses();
//     updateABI();
//     console.log(chainId);
//   }
// };
