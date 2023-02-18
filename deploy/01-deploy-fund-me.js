// async function main() {}

// main()
//     .then(() => {
//         process.exit(0)
//     })
//     .catch((error) => {
//         console.error(error)
//         process.exit(1)
//     })

// module.exports = async (hre) {
//     const { getNamedAccounts, deployments } = hre;
//     const namedAccounts = hre.getNamedAccounts;
//     const deployer = hre.deployments;
// }

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../Utils/verify")
require("dotenv").config()

// if chainID is X use address Y
// if chainID is Z use address A

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
        // console.log(ethUsdPriceFeedAddress)
    }

    const args = [ethUsdPriceFeedAddress]

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, 
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        await verify(fundMe.address, args)
    }
    log("-------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]