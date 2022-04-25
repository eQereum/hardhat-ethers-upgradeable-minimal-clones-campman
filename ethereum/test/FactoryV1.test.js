const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('FactoryV1 Contract -----------------------------------------------------', () => {
  let owner, manager1, manager2, investor1, investor2, attacker1, attacker2, another, hardhatCampaignFactory, deployedAddress2, deployedAddress3, campaignFactoryAddress;
  let campaignCloneTargetDeployAddress, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress;
  const provider = ethers.provider;

  //  Upgradeable Initialization
  before(async () => {
    [owner, manager1, manager2, investor1, investor2, attacker1, attacker2, another] = await ethers.getSigners();

    const campaignCloneTarget = await ethers.getContractFactory('Campaign');
    const tokenCloneTarget = await ethers.getContractFactory('Token');
    const poolCloneTarget = await ethers.getContractFactory('Pool');

    const campaignCloneTargetDeploy = await campaignCloneTarget.deploy();
    const tokenCloneTargetDeploy = await tokenCloneTarget.deploy();
    const poolCloneTargetDeploy = await poolCloneTarget.deploy();

    campaignCloneTargetDeployAddress = campaignCloneTargetDeploy.address;
    tokenCloneTargetDeployAddress = tokenCloneTargetDeploy.address;
    poolCloneTargetDeployAddress = poolCloneTargetDeploy.address;

    const implementation = await ethers.getContractFactory('FactoryV1');
    hardhatCampaignFactory = await upgrades.deployProxy(implementation, [campaignCloneTargetDeployAddress, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress], {
      initializer: 'initialize',
    });
    campaignFactoryAddress = hardhatCampaignFactory.address;
  });

  describe('initialize() after deploy proxy', () => {
    it('should pass equality of owner getter function of contract and owner account of test', async () => {
      expect((await hardhatCampaignFactory.factoryStatus()).owner).to.equal(await owner.address);
    });

    it('should revert because its already initialized', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).initialize(campaignCloneTargetDeployAddress, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress)).to.be.revertedWith('Initializable: contract is already initialized');
      await expect(hardhatCampaignFactory.connect(owner).initialize(campaignCloneTargetDeployAddress, tokenCloneTargetDeployAddress, poolCloneTargetDeployAddress)).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });

  describe('Pause()', () => {
    it('should revert when called by other accounts than owner', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).Pause({ gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass Pause by owner', async () => {
      await expect(hardhatCampaignFactory.connect(owner).Pause({ gasLimit: 50000 }))
        .to.emit(hardhatCampaignFactory, 'Paused')
        .withArgs();
    });

    it('should revert because factory is already paused', async () => {
      await expect(hardhatCampaignFactory.connect(owner).Pause({ gasLimit: 50000 })).to.be.revertedWith('Factory is already Paused');
    });
  });

  describe('unPause()', () => {
    it('revert when called by other accounts than owner', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).unPause({ gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass called by owner', async () => {
      await expect(hardhatCampaignFactory.connect(owner).unPause({ gasLimit: 50000 }))
        .to.emit(hardhatCampaignFactory, 'unPaused')
        .withArgs();
    });

    it('should revert because factory is already not paused', async () => {
      await expect(hardhatCampaignFactory.connect(owner).unPause({ gasLimit: 50000 })).to.be.revertedWith('Factory is already not Paused');
    });
  });

  describe('setTax(uint64)', () => {
    const newTax = ethers.utils.parseEther('0.02');
    it('should revert when called by other accounts than owner', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).setTax(newTax, { gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass when called by owner', async () => {
      await expect(hardhatCampaignFactory.connect(owner).setTax(newTax, { gasLimit: 50000 }))
        .to.emit(hardhatCampaignFactory, 'SetTax')
        .withArgs(newTax);
    });
  });

  describe('authorize(address)', () => {
    it('revert when called by other accounts than owner', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).authorize(await attacker2.address, { gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass called by owner', async () => {
      await expect(hardhatCampaignFactory.connect(owner).authorize(await manager1.address, { gasLimit: 60000 }))
        .to.emit(hardhatCampaignFactory, 'Authorized')
        .withArgs(await manager1.address);
    });
  });

  describe('blacklist()', () => {
    it('revert when called by other accounts than owner', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).blacklist(await attacker2.address, { gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass called by owner', async () => {
      await expect(hardhatCampaignFactory.connect(owner).blacklist(await attacker2.address, { gasLimit: 60000 }))
        .to.emit(hardhatCampaignFactory, 'Blacklisted')
        .withArgs(await attacker2.address);
    });
  });

  describe('createCampaign(string,string,string,uint256,uint256)', () => {
    let min, tax, deployedAddress, deployedAddressToken;
    before(async () => {
      min = ethers.utils.parseEther('0.01');
      tax = ethers.utils.parseEther('0.02');
      period = 2000;
    });

    it('should revert campaign creation by attacker1 because he is not authorized', async () => {
      await expect(hardhatCampaignFactory.connect(attacker1).createCampaign(ethers.utils.formatBytes32String('campA1'), 'descA1', 'ipfsA1', min, period, { value: tax, gasLimit: 200000 })).to.be.revertedWith('!Authorized');
    });

    it('should revert campaign creation by attacker2 because he is blacklisted', async () => {
      await hardhatCampaignFactory.connect(owner).authorize(await attacker2.address); // to make sure it will pass authorization condition
      await expect(hardhatCampaignFactory.connect(attacker2).createCampaign(ethers.utils.formatBytes32String('campA1'), 'descA1', 'ipfsA1', min, period, { value: tax, gasLimit: 200000 })).to.be.revertedWith('Blacklisted');
    });

    it('should revert because of tax', async () => {
      await expect(hardhatCampaignFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM11'), 'descM11', 'ipfsM11', min, period, { value: 0, gasLimit: 80000 })).to.be.revertedWith('!Tax');
    });

    it('should revert because of description length', async () => {
      const desc = Array(257).fill(0).toString().replaceAll(',', '');
      await expect(hardhatCampaignFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM11'), desc, 'ipfsM11', min, period, { value: tax, gasLimit: 80000 })).to.be.revertedWith('Campaign Description is too Big');
    });

    it('should pass campaign creation by manager1', async () => {
      // Note: it should emit 5 events:
      // events[0]: CloneCreationLog for Campaign
      // events[1]: CloneCreationLog for Token
      // events[2]: CloneInitializationSuccessLog for Token
      // events[3]: CloneInitializationSuccessLog for Campaign
      // events[4]: CreateCampaignLog

      const tx = await hardhatCampaignFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM11'), 'descM11', 'ipfsM11', min, period, { value: tax, gasLimit: 5000000 });

      deployedCampaignAddress = await hardhatCampaignFactory.connect(owner).Campaigns(0);
      deployedTokenAddress = (await hardhatCampaignFactory.connect(owner).campaignStatus(deployedCampaignAddress)).campaignTokenAddress;

      await expect(tx).to.emit(hardhatCampaignFactory, 'CreateCampaignLog').withArgs('successfully created', deployedCampaignAddress, deployedTokenAddress, 1);
    });
  });

  describe('getCampaigns()', () => {
    before(async () => {
      await hardhatCampaignFactory.authorize(await manager2.address);

      min = ethers.utils.parseEther('0.01');
      tax = ethers.utils.parseEther('0.02');
      period = 2000;

      const [deployTransaction2, deployTransaction3] = await Promise.all([
        hardhatCampaignFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM12'), 'descM12', 'ipfsM12', min, period, { value: tax, gasLimit: 5000000 }),
        hardhatCampaignFactory.connect(manager2).createCampaign(ethers.utils.formatBytes32String('campM21'), 'descM21', 'ipfsM21', min, period, { value: tax, gasLimit: 5000000 }),
      ]);

      const [receipt2, receipt3] = await Promise.all([deployTransaction2.wait(), deployTransaction3.wait()]);
      [deployedAddress2, deployedAddress3] = [receipt2.events[4].args.createdCampaignAddress, receipt3.events[4].args.createdCampaignAddress];
    });

    it('should return deployed campaigns addresses', async () => {
      const deployedAddresses = await hardhatCampaignFactory.connect(another).getCampaigns();
      expect(deployedAddresses.length).to.be.equal(3);
      expect(deployedAddress2).to.be.equal(deployedAddresses[1]);
      expect(deployedAddress3).to.be.equal(deployedAddresses[2]);
    });
  });

  describe('rejectCampaign(address)', () => {
    it('should return rejected campaign succesfully', async () => {
      const rejectTx = await hardhatCampaignFactory.connect(owner).rejectCampaign(deployedAddress2, { gasLimit: 3000000 });
      const receipt = await rejectTx.wait();
      expect(receipt.events[1].args.rejectedAddress).to.be.equal(deployedAddress2);
    });

    it('should revert when campaign was rejected before ', async () => {
      await expect(hardhatCampaignFactory.connect(owner).rejectCampaign(deployedAddress2, { gasLimit: 3000000 })).to.be.revertedWith('this campaign is already rejected');
    });
  });

  describe('withdrawTaxFees()', () => {
    it('should transfer fees for deploying 3 campaigns (0.06 = 3*0.02 ETH) to owner address', async () => {
      ownerBalanceBefore = ethers.utils.formatEther(await provider.getBalance(owner.address));
      await hardhatCampaignFactory.connect(owner).withdrawTaxFees();
      ownerBalanceAfter = ethers.utils.formatEther(await provider.getBalance(owner.address));
      const roundedDiffernce = Math.round((ownerBalanceAfter - ownerBalanceBefore) * 100) / 100;
      expect(roundedDiffernce).to.be.equal(0.06); // because owner is the caller & he should pay for every logic in contract(in this case transfer function), so transfer amount is slightly less than 0.06 (3*0.02)
    });
  });

  describe('fallback()', () => {
    it('should receive the incoming ether containing data', async () => {
      balanceBefore = ethers.utils.formatEther(await provider.getBalance(campaignFactoryAddress));
      const tx = await owner.sendTransaction({
        from: owner.address,
        to: campaignFactoryAddress,
        value: ethers.utils.parseEther('0.1'),
        data: '0x307868616D6564',
        gasPrice: provider.getGasPrice(),
        gasLimit: 30000,
        nonce: provider.getTransactionCount(owner.address, 'latest'),
      });
      const receipt = await tx.wait();
      balanceAfter = ethers.utils.formatEther(await provider.getBalance(campaignFactoryAddress));
      expect(Math.round((balanceAfter - balanceBefore) * 100) / 100).to.be.equal(0.1);
    });
  });

  describe('receive()', () => {
    it('should receive the incoming ether', async () => {
      balanceBefore = ethers.utils.formatEther(await provider.getBalance(campaignFactoryAddress));
      const tx = await owner.sendTransaction({
        from: owner.address,
        to: campaignFactoryAddress,
        value: ethers.utils.parseEther('0.1'),
        gasPrice: provider.getGasPrice(),
        gasLimit: 30000,
        nonce: provider.getTransactionCount(owner.address, 'latest'),
      });
      const receipt = await tx.wait();
      balanceAfter = ethers.utils.formatEther(await provider.getBalance(campaignFactoryAddress));
      expect(Math.round((balanceAfter - balanceBefore) * 100) / 100).to.be.equal(0.1);
    });
  });
});
