const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          // Deploying the fundme contract first before testing
          let fundMe
          let accountDeployer
          let mockV3Aggregator
          let sendValue = 3500000000000000000

          beforeEach(async () => {
              // Deploy using Hardhat-deploy
              accountDeployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"]) // Allows to deploy aeverything in the deploy folder
              // get the most recent deployed contract and save into the fundMe variable
              // using ethers. Connect to an account
              fundMe = await ethers.getContract("FundMe", accountDeployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  accountDeployer
              )
          })

          describe("constructor", async () => {
              it("Setting the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async () => {
              it("Value sent must be greater than minimum", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to soend more ETH"
                  )
              })

              it("updated the amount founded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue)
              })

              it("Adds funder to array of founders", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunders(0)
                  assert.equal(response, accountDeployer)
              })
          })
          describe("withdraw", async () => {
              // First fund the contract before testing
              beforeEch(async () => {
                  await fundMe.fun({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async () => {
                  //Arrange test(by setting the test up)
                  /* 1. Get the starting ballance of the fundme and the deployer to test 
            leta on how much change has occured everytime the withdraw() is called 
            */
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(accountDeployer)

                  // -------- Act ------

                  /* Perform transaction and 
            Check change on balances here 
            */

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(accountDeployer)

                  //gasCost

                  //Assert

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to withdraw multiple getFunders", async () => {
                  //Arrange
                  const accounts = await ethers.getSigners()

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectContract = await fundMe.connect(
                          account[i]
                      )
                      await fundMeConnectContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(accountDeployer)

                  //Act

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(accountDeployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //making sure that the getFunders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("only allows only the owner to withdraws", async () => {
                  const accounts = await ethers.getSigners()

                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("fundMe__NotOwner")
              })
          })
      })
