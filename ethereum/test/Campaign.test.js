const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('Campaign Contract -----------------------------------------------------', () => {
  let owner, factory, manager1, manager2, manager3, investor1, investor2, attacker1, attacker2, recipient, another, Campaign, hardhatCampaign1, hardhatCampaign2, hardhatCampaign3, deployedAddress1, deployedAddress2, deployedAddress3;

  let campaignCloneTargetDeployAddress, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress;

  const [min05, min, min2, min3] = [ethers.utils.parseEther('0.01'), ethers.utils.parseEther('0.02'), ethers.utils.parseEther('0.04'), ethers.utils.parseEther('0.06')];
  const [period1, period2, period3] = [10000, 20000, 30000];
  let totalContribution = ethers.utils.parseEther('0.08');
  const requestApprovalPeriod = 2592000;

  before('deploying Campaigns', async () => {
    [owner, factory, manager1, manager2, manager3, investor1, investor2, attacker1, attacker2, recipient, another] = await ethers.getSigners();
    const campaignCloneTarget = await ethers.getContractFactory('Campaign');
    const tokenCloneTarget = await ethers.getContractFactory('Token');
    const poolCloneTarget = await ethers.getContractFactory('Pool');

    const campaignCloneTargetDeploy = await campaignCloneTarget.deploy();
    const tokenCloneTargetDeploy = await tokenCloneTarget.deploy();
    const poolCloneTargetDeploy = await poolCloneTarget.deploy();

    campaignCloneTargetDeployAddress = campaignCloneTargetDeploy.address;
    tokenCloneTargetDeployAddress = tokenCloneTargetDeploy.address;
    poolCloneTargetDeployAddress = poolCloneTargetDeploy.address;

    [hardhatCampaign1, hardhatCampaign2, hardhatCampaign3] = await Promise.all([
      upgrades.deployProxy(campaignCloneTarget, [owner.address, factory.address, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress, ethers.utils.formatBytes32String('camp1'), 'desc1', 'banner1', min, period1, manager1.address], {
        initializer: 'initialize',
      }),
      upgrades.deployProxy(campaignCloneTarget, [owner.address, factory.address, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress, ethers.utils.formatBytes32String('camp2'), 'desc2', 'banner2', min2, period2, manager2.address], {
        initializer: 'initialize',
      }),
      upgrades.deployProxy(campaignCloneTarget, [owner.address, factory.address, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress, ethers.utils.formatBytes32String('camp3'), 'desc3', 'banner3', min3, period3, manager3.address], {
        initializer: 'initialize',
      }),
    ]);

    // address payable _owner,
    // address payable _factory,
    // address payable _token,
    // address payable _pool,
    // bytes32 _name,
    // string memory _description,
    // string memory _banner,
    // uint64 _minimum,
    // uint32 _contributionPeriod,
    // address _manager

    [deployedAddress1, deployedAddress2, deployedAddress3] = [hardhatCampaign1.address, hardhatCampaign2.address, hardhatCampaign3.address];
  });

  describe('contribute()', () => {
    it('should revert because of minimum contribution', async () => {
      await expect(hardhatCampaign1.connect(investor1).contribute({ value: min05 })).to.be.revertedWith('value must be gt minimum contribution');
    });

    it('should emit ContributionLog & confirm contribution value', async () => {
      const tx = await Promise.all([hardhatCampaign1.connect(investor1).contribute({ value: min }), hardhatCampaign1.connect(investor1).contribute({ value: min }), hardhatCampaign1.connect(investor2).contribute({ value: min2 })]);
      const receipt = await Promise.all([tx[0].wait(), tx[1].wait(), tx[2].wait()]);

      expect(receipt[0].events[1].args.value).to.be.equal(min);
      expect(receipt[0].events[1].args.investor).to.be.equal(await investor1.address);
      expect(receipt[1].events[1].args.value).to.be.equal(min);
      expect(receipt[1].events[1].args.investor).to.be.equal(await investor1.address);
      expect(receipt[2].events[1].args.value).to.be.equal(min2);
      expect(receipt[2].events[1].args.investor).to.be.equal(await investor2.address);
    });

    it('should confirm investorsCount = 2', async () => {
      expect(await hardhatCampaign1.investorsCount()).to.be.equal(2);
    });

    it('should confirm isInvestor[investor1], isInvestor[investor2]', async () => {
      expect(await hardhatCampaign1.isInvestor(investor1.address)).to.be.equal(true);
      expect(await hardhatCampaign1.isInvestor(investor2.address)).to.be.equal(true);
    });

    it('should confirm contributionperinvestor[investor1]', async () => {
      expect(await hardhatCampaign1.contributionPerInvestor(investor1.address)).to.be.equal(min2);
      expect(await hardhatCampaign1.contributionPerInvestor(investor2.address)).to.be.equal(min2);
    });

    it('should confirm availableBalance', async () => {
      expect(await hardhatCampaign1.availableBalance()).to.be.equal(totalContribution);
    });

    it('should confirm totalContribution', async () => {
      expect(await hardhatCampaign1.totalContribution()).to.be.equal(totalContribution);
    });

    it('should travel to now + period1 => so contribution time is over', async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      await ethers.provider.send('evm_increaseTime', [period1]);
      await ethers.provider.send('evm_mine');

      const blockNumAfter = await ethers.provider.getBlockNumber();
      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
      const timestampAfter = blockAfter.timestamp;

      // console.log(`timeStampBefore: ${timestampBefore}, timeStampAfter: ${timestampAfter}`);
      expect(blockNumAfter).to.be.equal(blockNumBefore + 1);
      expect(Math.round(timestampAfter / 10)).to.be.equal(Math.round((timestampBefore + period1) / 10));
    });

    it('should revert because of ending the contribution time', async () => {
      await expect(hardhatCampaign1.connect(investor2).contribute({ value: min })).to.be.revertedWith('contribution time is over');
    });
  });

  describe('rejectCamapign()', () => {
    before(async () => {
      await Promise.all([hardhatCampaign2.connect(investor1).contribute({ value: min2 }), hardhatCampaign2.connect(investor2).contribute({ value: min2 })]);
    });

    it('should revert because caller is not owner or factory', async () => {
      await Promise.all[(expect(hardhatCampaign1.connect(investor1).rejectCampaign()).to.be.revertedWith('only owner can call this function'), expect(hardhatCampaign1.connect(manager1).rejectCampaign()).to.be.revertedWith('only owner can call this function'))];
    });

    it('should emit createPoolLog event which pool address is not 0x0 & not campaign2 address because campaign2 has funds in it', async () => {
      const tx = await hardhatCampaign2.connect(owner).rejectCampaign();
      const receipt = await tx.wait();

      expect(receipt.events[2].args.message).to.be.equal('Pool Created - Succeccfully Rejected');
      expect(receipt.events[2].args.rejectedAddress).to.be.equal(deployedAddress2);
      expect(receipt.events[2].args.poolAddress).to.not.equal(deployedAddress2);
      expect(receipt.events[2].args.poolAddress).to.not.equal('0x0000000000000000000000000000000000000000');
    });

    it('should emit createPoolLog event which pool address is not 0x0 but campaign3 address because campaign3 is empty', async () => {
      const tx = await hardhatCampaign3.connect(owner).rejectCampaign();
      const receipt = await tx.wait();

      expect(receipt.events[0].args.message).to.be.equal('Empty Campaign - Succeccfully Rejected');
      expect(receipt.events[0].args.rejectedAddress).to.be.equal(deployedAddress3);
      expect(receipt.events[0].args.poolAddress).to.be.equal(deployedAddress3);
      expect(receipt.events[0].args.poolAddress).to.not.equal('0x0000000000000000000000000000000000000000');
    });

    it('should confirm campaign rejection by checking isRejectedByOwner, isClosed & availableBalance', async () => {
      const [isRejected2, isClosed2, availableBalance2, isRejected3, isClosed3, availableBalance3] = await Promise.all([
        hardhatCampaign2.connect(owner).isRejectedByOwner(),
        hardhatCampaign2.connect(owner).isClosed(),
        hardhatCampaign2.connect(owner).availableBalance(),
        hardhatCampaign3.connect(owner).isRejectedByOwner(),
        hardhatCampaign3.connect(owner).isClosed(),
        hardhatCampaign3.connect(owner).availableBalance(),
      ]);

      expect(isRejected2).to.be.equal(true);
      expect(isClosed2).to.be.equal(true);
      expect(availableBalance2).to.be.equal(0);
      expect(isRejected3).to.be.equal(true);
      expect(isClosed3).to.be.equal(true);
      expect(availableBalance3).to.be.equal(0);
    });
  });

  describe('createRequest()', () => {
    const description = [Array(257).fill(0).toString().replaceAll(',', ''), Array(10).fill(1).toString().replaceAll(',', ''), Array(20).fill(2).toString().replaceAll(',', ''), Array(30).fill(3).toString().replaceAll(',', '')];
    const value = [ethers.utils.parseEther('0.5'), 1000, 2000, 3000];

    it('should travel to now - period1 => so contribution time is not over', async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      await ethers.provider.send('evm_increaseTime', [-period1]);
      await ethers.provider.send('evm_mine');

      const blockNumAfter = await ethers.provider.getBlockNumber();
      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
      const timestampAfter = blockAfter.timestamp;

      // console.log(`timeStampBefore: ${timestampBefore}, timeStampAfter: ${timestampAfter}`);
      expect(blockNumAfter).to.be.equal(blockNumBefore + 1);
      expect(Math.round(timestampAfter / 10)).to.be.equal(Math.round((timestampBefore - period1) / 10));
    });

    it('should revert because contribution is not over', async () => {
      await expect(hardhatCampaign1.connect(manager1).createRequest(description[1], value[1], recipient.address)).to.be.revertedWith('you have to wait until the contributiom period is over !!!');
    });

    it('should travel to now + period1 => so contribution time is over', async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      await ethers.provider.send('evm_increaseTime', [+period1]);
      await ethers.provider.send('evm_mine');

      const blockNumAfter = await ethers.provider.getBlockNumber();
      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
      const timestampAfter = blockAfter.timestamp;

      // console.log(`timeStampBefore: ${timestampBefore}, timeStampAfter: ${timestampAfter}`);
      expect(blockNumAfter).to.be.equal(blockNumBefore + 1);
      expect(Math.round(timestampAfter / 10)).to.be.equal(Math.round((timestampBefore + period1) / 10));
    });

    it('should revert when called by other accounts than manager', async () => {
      await expect(
        Promise.all([
          hardhatCampaign1.connect(owner).createRequest(description[1], value[1], recipient.address),
          hardhatCampaign1.connect(manager2).createRequest(description[1], value[1], recipient.address),
          hardhatCampaign1.connect(investor1).createRequest(description[1], value[1], recipient.address),
          hardhatCampaign1.connect(attacker1).createRequest(description[1], value[1], recipient.address),
          hardhatCampaign1.connect(recipient).createRequest(description[1], value[1], recipient.address),
        ])
      ).to.be.revertedWith('only manager can call this function');
    });

    it('should revert when called the closed campaign', async () => {
      await Promise.all([
        expect(hardhatCampaign2.connect(manager2).createRequest(description[2], value[2], recipient.address)).to.be.revertedWith('campaign is not available anymore'),
        expect(hardhatCampaign3.connect(manager3).createRequest(description[2], value[3], recipient.address)).to.be.revertedWith('campaign is not available anymore'),
      ]);
    });

    it('should revert because description length is too big', async () => {
      await expect(hardhatCampaign1.connect(manager1).createRequest(description[0], value[1], recipient.address)).to.be.revertedWith('request description is too big');
    });

    it('should revert because requested value is more than campaigns avalilable balance', async () => {
      await expect(hardhatCampaign1.connect(manager1).createRequest(description[1], value[0], recipient.address)).to.be.revertedWith('requested value is more than available balance');
    });

    it('should create request succesfully', async () => {
      const tx = await Promise.all([
        hardhatCampaign1.connect(manager1).createRequest(description[1], value[1], recipient.address),
        hardhatCampaign1.connect(manager1).createRequest(description[2], value[2], recipient.address),
        hardhatCampaign1.connect(manager1).createRequest(description[3], value[3], recipient.address),
      ]);
      const receipt = await Promise.all([tx[0].wait(), tx[1].wait(), tx[2].wait()]);
      expect(receipt[0].events[0].args.value).to.be.equal(value[1]);
      expect(receipt[0].events[0].args.description).to.be.equal(description[1]);
      expect(receipt[0].events[0].args.recipient).to.be.equal(await recipient.address);
      expect(receipt[1].events[0].args.value).to.be.equal(value[2]);
      expect(receipt[1].events[0].args.description).to.be.equal(description[2]);
      expect(receipt[1].events[0].args.recipient).to.be.equal(await recipient.address);
      expect(receipt[2].events[0].args.value).to.be.equal(value[3]);
      expect(receipt[2].events[0].args.description).to.be.equal(description[3]);
      expect(receipt[2].events[0].args.recipient).to.be.equal(await recipient.address);

      const request = await Promise.all([hardhatCampaign1.connect(owner).requests(0), hardhatCampaign1.connect(owner).requests(1), hardhatCampaign1.connect(owner).requests(2)]);

      expect(request[0].description).to.be.equal(description[1]);
      expect(request[0].value).to.be.equal(value[1]);
      expect(request[0].recipient).to.be.equal(await recipient.address);
      expect(request[0].isComplete).to.be.equal(false);
      expect(request[0].isCancel).to.be.equal(false);
      expect(request[0].approversCount).to.be.equal(0);

      expect(request[1].description).to.be.equal(description[2]);
      expect(request[1].value).to.be.equal(value[2]);
      expect(request[1].recipient).to.be.equal(await recipient.address);
      expect(request[1].isComplete).to.be.equal(false);
      expect(request[1].isCancel).to.be.equal(false);
      expect(request[1].approversCount).to.be.equal(0);

      expect(request[2].description).to.be.equal(description[3]);
      expect(request[2].value).to.be.equal(value[3]);
      expect(request[2].recipient).to.be.equal(await recipient.address);
      expect(request[2].isComplete).to.be.equal(false);
      expect(request[2].isCancel).to.be.equal(false);
      expect(request[2].approversCount).to.be.equal(0);
    });
  });

  describe('approveRequest()', () => {
    it('should revert when caller is not investor', async () => {
      await expect(hardhatCampaign1.connect(attacker1).approveRequest(0)).to.be.revertedWith('only investor can call this function');
    });

    it('should emit ApproveRequestLog()', async () => {
      const tx = await Promise.all([hardhatCampaign1.connect(investor1).approveRequest(0), hardhatCampaign1.connect(investor2).approveRequest(0)]);
      const receipt = await Promise.all([tx[0].wait(), tx[1].wait()]);
      expect(receipt[0].events[0].args.index).to.be.equal(0);
      expect(receipt[0].events[0].args.approver).to.be.equal(await investor1.address);
      expect(receipt[1].events[0].args.index).to.be.equal(0);
      expect(receipt[1].events[0].args.approver).to.be.equal(await investor2.address);
    });

    it('should revert when request was approved by this investor before', async () => {
      await expect(hardhatCampaign1.connect(investor1).approveRequest(0)).to.be.revertedWith('this investor has approved the request already');
    });

    it('should travel to now + requestApprovalPeriod => so request approval time is over', async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      await ethers.provider.send('evm_increaseTime', [+requestApprovalPeriod]);
      await ethers.provider.send('evm_mine');

      const blockNumAfter = await ethers.provider.getBlockNumber();
      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
      const timestampAfter = blockAfter.timestamp;

      // console.log(`timeStampBefore: ${timestampBefore}, timeStampAfter: ${timestampAfter}`);
      expect(blockNumAfter).to.be.equal(blockNumBefore + 1);
      expect(Math.round(timestampAfter / 10)).to.be.equal(Math.round((timestampBefore + requestApprovalPeriod) / 10));
    });

    it('should revert when request approval period is over', async () => {
      await expect(hardhatCampaign1.connect(investor2).approveRequest(0)).to.be.revertedWith('request approval period is over');
    });
  });

  describe('finalizeRequest()', () => {
    it('should revert when called by someone other than manager1', async () => {
      await expect(hardhatCampaign1.connect(manager2).finalizeRequest(0)).to.be.revertedWith('only manager can call this function');
    });

    it('should revert when approvers < 50%', async () => {
      await Promise.all([
        expect(hardhatCampaign1.connect(manager1).finalizeRequest(1)).to.be.revertedWith('at least 50 percent of investors should approve this request'),
        expect(hardhatCampaign1.connect(manager1).finalizeRequest(2)).to.be.revertedWith('at least 50 percent of investors should approve this request'),
      ]);
    });

    it('should emit FinalizeRequestLog(index,recipient)', async () => {
      await expect(hardhatCampaign1.connect(manager1).finalizeRequest(0))
        .to.emit(hardhatCampaign1, 'FinalizeRequestLog')
        .withArgs(0, await recipient.address);
    });
  });

  describe('cancelRequest()', () => {
    it('should revert when caller is not manager', async () => {
      await expect(hardhatCampaign1.connect(attacker1).cancelRequest(1)).to.be.revertedWith('only manager can call this function');
    });

    it('should emit CancelRequestLog(index)', async () => {
      await expect(hardhatCampaign1.connect(manager1).cancelRequest(1)).to.emit(hardhatCampaign1, 'CancelRequestLog').withArgs(1);
    });
  });

  describe('isCancel & isComplete', () => {
    it('should revert when request is cancelled', async () => {
      await expect(hardhatCampaign1.connect(investor1).approveRequest(1)).to.be.revertedWith('this request has been cancelled');
      await expect(hardhatCampaign1.connect(manager1).finalizeRequest(1)).to.be.revertedWith('this request has been cancelled');
      await expect(hardhatCampaign1.connect(manager1).cancelRequest(1)).to.be.revertedWith('this request has been cancelled already');
    });

    it('should revert when request is completed', async () => {
      await expect(hardhatCampaign1.connect(investor1).approveRequest(0)).to.be.revertedWith('this request has been completed');
      await expect(hardhatCampaign1.connect(manager1).finalizeRequest(0)).to.be.revertedWith('this request has been completed already');
      await expect(hardhatCampaign1.connect(manager1).cancelRequest(0)).to.be.revertedWith('this request has been completed');
    });
  });
});
