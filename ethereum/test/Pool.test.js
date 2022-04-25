const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

const Pool = require('../artifacts/contracts/Pool.sol/Pool.json');

describe('Pool Contract -----------------------------------------------------', () => {
  let owner, factory, manager, investor1, investor2, attacker, Campaign, campaignAddress, hardhatCampaign, poolAddress, hardhatPool, deployedAddress;

  it('deploying Campaign & Pool', async () => {
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

    await Promise.all([hardhatCampaign.connect(investor1).contribute({ value: min }), hardhatCampaign.connect(investor2).contribute({ value: min })]);

    const tx = await hardhatCampaign.connect(owner).rejectCampaign();
    const receipt = await tx.wait();
    poolAddress = receipt.events[2].args.poolAddress;
    hardhatPool = new ethers.Contract(poolAddress, Pool.abi, owner);
  });

  describe('getPoolBalance()', () => {
    it('should return Pools Balance', async () => {
      expect(await hardhatPool.connect(owner).getPoolBalance()).to.be.equal(ethers.utils.parseEther('0.02'));
    });
  });

  describe('getInvestorContributionAmount()', () => {
    it('should return investors contribution amount', async () => {
      const contributionAmounts = await Promise.all([hardhatPool.connect(owner).getInvestorContributionAmount(investor1.address), hardhatPool.connect(owner).getInvestorContributionAmount(investor2.address)]);
      for (let i = 0; i < contributionAmounts.length; i++) {
        expect(contributionAmounts[i]).to.be.equal(ethers.utils.parseEther('0.01'));
      }
    });
  });

  describe('takeShareBack()', () => {
    it('should revert when caller is not investor', async () => {
      await expect(hardhatPool.connect(attacker).takeShareBack()).to.be.revertedWith('only campaign investors can take their ETH share');
    });

    it('should emit TookShareBackLog(investor,value)', async () => {
      const balanceInvestor1Before = ethers.utils.formatEther(await ethers.provider.getBalance(investor1.address));
      const tx = await hardhatPool.connect(investor1).takeShareBack();
      const balanceInvestor1After = ethers.utils.formatEther(await ethers.provider.getBalance(investor1.address));
      const roundedDiffernce = Math.round((balanceInvestor1After - balanceInvestor1Before) * 100) / 100;

      const receipt = await tx.wait();
      expect(receipt.events[0].args.investor).to.be.equal(await investor1.address);
      expect(receipt.events[0].args.value).to.be.equal(ethers.utils.parseEther('0.01'));

      expect(roundedDiffernce).to.be.equal(0.01);
    });

    it('should revert when investor has already taken his share', async () => {
      await expect(hardhatPool.connect(investor1).takeShareBack()).to.be.revertedWith('this investor has taken ETH share already');
    });

    it('should emit PoolClosedLog the pool after all investors took their share back', async () => {
      const tx = await hardhatPool.connect(investor2).takeShareBack();
      const receipt = await tx.wait();

      expect(receipt.events[1].args.campaignAddress).to.be.equal(campaignAddress);
      expect(receipt.events[1].args.poolAddress).to.be.equal(poolAddress);

      await expect(hardhatPool.connect(investor2).takeShareBack()).to.be.revertedWith('pool is closed');
    });
  });
});
