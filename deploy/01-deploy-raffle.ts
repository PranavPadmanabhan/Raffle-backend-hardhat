import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper.config";
import { updateABI, updateContractAddresses } from "../utils/details";
import getData from "../utils/getAddress";
import verify from "../utils/verify";

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30");

const FRONTEND_CONTRACT_ADDRESS_FILE =
  "../../solidity tutorial/frontend/raffle/constants/contractAddresses.json";
const FRONTEND_ABI_FILE =
  "../../solidity tutorial/frontend/raffle/constants/abi.json";

const deployRaffle: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;
  const chainId = network.config.chainId;
  let vrfCoodinatorAddress: any;
  let entranceFee: any;
  let subscriptionId: any;
  let gasLane: any;
  let callBackGasLimit: any;
  let interval: any;

  if (developmentChains.includes(network.name)) {
    const VRFCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoodinatorAddress = VRFCoordinatorMock.address;
    entranceFee = networkConfig[31337].entranceFee;
    const transctionResponse = await VRFCoordinatorMock.createSubscription();
    const transactionReceipt = await transctionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    gasLane = getData(chainId).gasLane;
    callBackGasLimit = getData(chainId).callbackGasLimit;
    interval = getData(chainId).interval;
    await VRFCoordinatorMock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoodinatorAddress = getData(chainId).vrfCoordinatorAddress;
    entranceFee = getData(chainId).entranceFee;
    subscriptionId = getData(chainId).subscriptionId;
    gasLane = getData(chainId).gasLane;
    callBackGasLimit = getData(chainId).callbackGasLimit;
    interval = getData(chainId).interval;
  }

  const args = [
    vrfCoodinatorAddress,
    entranceFee,
    gasLane,
    subscriptionId,
    callBackGasLimit,
    interval,
  ];

  const raffleContract = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
  });
  // console.log(`vrfcoordinator: ${vrfCoodinatorAddress}`);
  // console.log(`key hash: ${gasLane}`);
  // console.log(`subId: ${subscriptionId}`);
  // console.log(`callbackGasLimit: ${callBackGasLimit}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(raffleContract.address, args);
    updateABI(raffleContract.abi);
    updateContractAddresses(raffleContract);
  } else {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock",
      deployer
    );

    await vrfCoordinatorV2Mock.addConsumer(
      subscriptionId.toNumber(),
      raffleContract.address
    );
    updateABI(raffleContract.abi);
    updateContractAddresses(raffleContract);
    log("adding consumer...");
    log("Consumer added!");
  }
};

module.exports = deployRaffle;

module.exports.tags = ["all", "raffle"];
