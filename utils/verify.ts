import { run, deployments } from "hardhat";

const verify = async (contactAddress: any, args: any) => {
  const { log } = deployments;

  console.log("verifying Please wait...");
  try {
    await run("verify:verify", {
      address: contactAddress,
      constructorArguments: args,
    }).then(() => log("verification Successful"));
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      log("Already Verified");
    } else {
      console.log(e);
    }
  }
};

export default verify;
