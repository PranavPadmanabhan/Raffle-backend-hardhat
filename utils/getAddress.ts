import { networkConfig } from "../helper.config";

const getData = (chainId: number | undefined) => {
  switch (chainId) {
    case 5:
      return {
        vrfCoordinatorAddress: networkConfig[5].vrfCoordinatorV2,
        entranceFee: networkConfig[5].entranceFee,
        gasLane:
          "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: networkConfig[5].subscriptionId,
        callbackGasLimit: networkConfig[5].callbackGasLimit,
        interval: networkConfig[5].interval,
      };

    case 31337:
      return {
        entranceFee: networkConfig[5].entranceFee,
        gasLane:
          "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: networkConfig[5].subscriptionId,
        callbackGasLimit: networkConfig[5].callbackGasLimit,
        interval: networkConfig[31337].interval,
      };

    default:
      return {
        vrfCoordinatorAddress: networkConfig[5].vrfCoordinatorV2,
        entranceFee: networkConfig[5].entranceFee,
        gasLane:
          "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: networkConfig[5].subscriptionId,
        callbackGasLimit: networkConfig[5].callbackGasLimit,
        interval: networkConfig[5].interval,
      };
  }
};

export default getData;
