const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const CampaignToken = require('../artifacts/contracts/Token.sol/Token.json');

describe('CampaignToken Contract -----------------------------------------------------', () => {
  let owner, factory, manager, investor1, investor2, attacker, Campaign, campaignAddress, hardhatCampaign, campaignTokenAddress, hardhatPool, deployedAddress;

  before('deploying Campaign & Pool', async () => {
    [owner, factory, manager, investor1, investor2, attacker, deployedAddress] = await ethers.getSigners();
    const min = ethers.utils.parseEther('0.01');
    const total = ethers.utils.parseEther('0.02');

    const campaignCloneTarget = await ethers.getContractFactory('Campaign');
    const tokenCloneTarget = await ethers.getContractFactory('Token');
    const poolCloneTarget = await ethers.getContractFactory('Pool');

    const campaignCloneTargetDeploy = await campaignCloneTarget.deploy();
    const tokenCloneTargetDeploy = await tokenCloneTarget.deploy();
    const poolCloneTargetDeploy = await poolCloneTarget.deploy();
    campaignCloneTargetDeployAddress = campaignCloneTargetDeploy.address;
    tokenCloneTargetDeployAddress = tokenCloneTargetDeploy.address;
    poolCloneTargetDeployAddress = poolCloneTargetDeploy.address;

    hardhatCampaign = await upgrades.deployProxy(campaignCloneTarget, [owner.address, factory.address, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress, ethers.utils.formatBytes32String('camp1'), 'desc1', 'banner1', min, 1000, manager.address], {
      initializer: 'initialize',
    });

    campaignAddress = hardhatCampaign.address;

    campaignTokenAddress = await hardhatCampaign.connect(owner).campaignTokenAddress();
    hardhatCampaignToken = new ethers.Contract(campaignTokenAddress, CampaignToken.abi, owner);
  });

  describe('mint()', () => {
    it('should revert when caller is not campaign', async () => {
      await expect(hardhatCampaignToken.connect(owner).mint(investor1.address, ethers.utils.parseEther('0.01'))).to.be.revertedWith('only campaign can mint tokens');
    });

    it('should emit Transfer() in ERC20 ', async () => {
      await expect(hardhatCampaign.connect(investor1).contribute({ value: ethers.utils.parseEther('0.01') }))
        .to.emit(hardhatCampaignToken, 'Transfer')
        .withArgs('0x0000000000000000000000000000000000000000', await investor1.address, ethers.utils.parseEther('1'));
    });
  });
});
