import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper.config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import getData from "../../utils/getAddress";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", async () => {
      let RaffleContract: Raffle;
      const chainId = network.config.chainId;
      let raffleEntranceFee: any;
      let deployer: any;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        // await deployments.fixture(["all"]);
        RaffleContract = await ethers.getContract("Raffle", deployer);
        raffleEntranceFee = await RaffleContract.getEntranceFee();
      });

      describe("fullfillrandomWords", async () => {
        // beforeEach(async () => {

        // });
        it("should set up live chainlink vrfCoordinator and keepers and set a winner", async () => {
          const accounts = await ethers.getSigners();
          const startingTimeStamp = await RaffleContract.getTimeStamp();
          const winnerStartingBalance = await accounts[0].getBalance();

          await new Promise<void>(async (resolve, reject) => {
            const bal = await ethers.provider.getBalance(
              RaffleContract.address
            );
            console.log(bal.toString());
            RaffleContract.once("WinnerPicked", async () => {
              console.log("Getting the winner..");

              try {
                const recentWinner = await RaffleContract.getRandomWinner();
                console.log(recentWinner);
                const raffleState = await RaffleContract.getRaffleState();
                const winnerBalance = await accounts[0].getBalance();
                console.log(`current: ${winnerBalance.toString()}`);
                console.log(winnerStartingBalance.toString());
                const endingTimeStamp = await RaffleContract.getTimeStamp();
                assert.equal(raffleState.toString(), "0");
                assert.equal(recentWinner, accounts[0].address);
                await expect(RaffleContract.getPlayer(0)).to.be.reverted;
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            await RaffleContract.enterRaffle({ value: raffleEntranceFee }).then(
              (tx: any) => console.log(tx)
            );
          });
          //   await RaffleContract.enterRaffle({
          //     value: raffleEntranceFee,
          //   });
        });
      });
    });
