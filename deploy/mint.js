const { network, ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // Random Card NFT
    const randomIpfsNft = await ethers.getContract("CardNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    // Need to listen for response
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000) // 5 minute timeout time
        // setup listener for our event
        randomIpfsNft.once("NftMinted", async () => {
            resolve()
        })
        if (chainId == 31337) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })
    const token_rng = await randomIpfsNft.getLastRng()
    const token_counter = (await randomIpfsNft.getTokenCounter()) - 1
    console.log(token_counter)
    const token_uri = await randomIpfsNft.getCardTokenUris(token_counter)
    console.log(`the nft will be minted with the following rng seed: ${token_rng}`)
    console.log(`New Random Card NFT minted tokenURI: ${token_uri}`)
}
module.exports.tags = ["all", "mint"]
