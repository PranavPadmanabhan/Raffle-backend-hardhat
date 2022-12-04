import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper.config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import getData from "../../utils/getAddress";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", async () => {
      let RaffleContract: Raffle;
      let VRFCoordinatorV2Mock: VRFCoordinatorV2Mock;
      const chainId = network.config.chainId;
      let raffleEntranceFee: any;
      let deployer: any;
      let interval: any;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        RaffleContract = await ethers.getContract("Raffle", deployer);
        VRFCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffleEntranceFee = await RaffleContract.getEntranceFee();
        interval = await RaffleContract.getInterval();
      });
      describe("constructor", async () => {
        it("should initialize raffle correctly", async () => {
          const raffleState = await RaffleContract.getRaffleState();
          const interval = await RaffleContract.getInterval();
          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), getData(chainId).interval);
        });
      });

      describe("enter Raffle", async () => {
        it("should revert when you dont sent enough", async () => {
          await expect(
            RaffleContract.enterRaffle()
          ).to.be.revertedWithCustomError(
            RaffleContract,
            "Raffle__notEnough_Ether"
          );
        });

        it("updates when someone enter raffle", async () => {
          await RaffleContract.enterRaffle({ value: raffleEntranceFee });
          const player = await RaffleContract.getPlayer(0);
          assert.equal(player, deployer);
        });
        it("emit event on raffle enter", async () => {
          await expect(
            RaffleContract.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(RaffleContract, "RaffleEnter");
        });
        it("doesn't allow enter when raffle is calculating", async () => {
          await RaffleContract.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 3,
          ]);
          await network.provider.send("evm_mine", []);
          await RaffleContract.performUpkeep([]);
          const state = await RaffleContract.getRaffleState();
          await expect(
            RaffleContract.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWithCustomError(RaffleContract, "Raffle__IsNotOpen");
        });
      });
      describe("checkupkeep", async () => {
        it("returns false if people haven't sent ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 3,
          ]);
          await network.provider.send("evm_mine", []);
          const { upKeepNeeded } = await RaffleContract.callStatic.checkUpkeep(
            []
          );
          assert.equal(upKeepNeeded, false);
        });
        it("returns false if raffle isn't open", async () => {
          await RaffleContract.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 3,
          ]);
          await network.provider.send("evm_mine", []);
          await RaffleContract.performUpkeep("0x");
          const { upKeepNeeded } = await RaffleContract.callStatic.checkUpkeep(
            []
          );
          assert.equal(upKeepNeeded, false);
        });
        it("returns false if there are no players or has no balance", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 3,
          ]);
          await network.provider.send("evm_mine", []);
          const { upKeepNeeded } = await RaffleContract.callStatic.checkUpkeep(
            []
          );
          assert.equal(upKeepNeeded, false);
        });
      });
      describe("PerformUpKeep", async () => {
        it("only run if checkupkeep is true", async () => {
          await RaffleContract.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await RaffleContract.performUpkeep("0x");
          assert(tx);
        });
        it("should revert if checkupkeep is false", async () => {
          await expect(
            RaffleContract.performUpkeep([])
          ).to.be.revertedWithCustomError(
            RaffleContract,
            "Raffle__UpkeepNotNeeded"
          );
        });
        it("should set raffle state calculating and calls vrfCoordinator", async () => {
          await RaffleContract.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await RaffleContract.performUpkeep("0x");
          const txReceipt = await tx.wait(1);
          const requestId = txReceipt?.events[1]?.args?.requestId;
          const state = await RaffleContract.getRaffleState();
          assert.equal(state.toString(), "1");
          assert(requestId.toNumber() > 0);
        });
      });
      describe("fullfillRandomWords", async () => {
        beforeEach(async () => {
          await RaffleContract.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const bal = await ethers.provider.getBalance(RaffleContract.address);
          console.log(bal.toString());
        });
        it("can only be called after performupkeep", async () => {
          await expect(
            VRFCoordinatorV2Mock.fulfillRandomWords(0, RaffleContract.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            VRFCoordinatorV2Mock.fulfillRandomWords(1, RaffleContract.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("should pick a winner and reset the array and send the prize to winner", async () => {
          const accounts = await ethers.getSigners();
          const participants = 3;
          const startingAccount = 1;
          for (let i = startingAccount; i < participants; i++) {
            const connectedAccount = RaffleContract.connect(accounts[1]);
            await connectedAccount.enterRaffle({ value: raffleEntranceFee });
          }
          const startingTime = await RaffleContract.getTimeStamp();
          await new Promise<void>(async (resolve, reject) => {
            console.log("Getting the winner..");
            RaffleContract.once("WinnerPicked", async () => {
              try {
                const winner = await RaffleContract.getRandomWinner();
                console.log(winner);
                console.log(accounts[1].address);
                console.log(accounts[2].address);
                const endingTime = await RaffleContract.getTimeStamp();
                const numOfPlayers = await RaffleContract.getNumOfPlayers();
                const endingBalance = ethers.provider.getBalance(
                  RaffleContract.address
                );
                const state = await RaffleContract.getRaffleState();
                assert.equal(state.toString(), "0");
                assert.equal((await endingBalance).toString(), "0");
                assert(endingTime > startingTime);
                assert.equal(numOfPlayers.toString(), "0");
              } catch (e) {
                reject(e);
              }
              resolve();
            });
            const tx = await RaffleContract.performUpkeep([]);
            const txReceipt = await tx.wait(1);
            await VRFCoordinatorV2Mock.fulfillRandomWords(
              txReceipt.events[1].args.requestId,
              RaffleContract.address
            );
          });
        });
      });
    });
