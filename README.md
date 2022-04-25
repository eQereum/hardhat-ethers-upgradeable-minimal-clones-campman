# Campaign Management Project using Hardhat/Ethers

This project represents deploying of a Campaign Management Project that is upgradeable using **OpenZeppelin** [**Transparent Upgradeable Proxy**](https://docs.openzeppelin.com/contracts/4.x/api/proxy#TransparentUpgradeableProxy): A proxy with a built in admin and upgrade interface.

In summary, first time you will deploy 3 separate contracts with the following sequence:

1. **Implementation**: Contains contracts logic that is the the only contract that will be upgraded every time and admin contract will set this new implementation contract address in TransparentUpgradeableProxy contract.
2. **ProxyAdmin**: Has `immutable` address that will set implementation contract address every time on TransparentUpgradeableProxy contract.
3. **TransparentUpgradeableProxy**: Has `immutable` address that will interact with user and it will `delegatecall` to implementation contract functions.

**Note:** Make sure you don't change storage slots order for state variables (if you intent to add new state variables, add it after original ones).

This project also benefits from **OpenZeppelin** [**Minimal Clones**](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones). To simply and cheaply clone contract functionality in an immutable way, **EIP-1167** standard specifies a minimal bytecode implementation that delegates all calls to a known, fixed address.

The exact bytecode of the standard clone contract is this: `0x363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3` wherein the bytes at indices 10 - 29 (inclusive) are replaced with the 20 byte address of the master functionality contract.

<div style="display:flex;justify-content:center">
<img width="50%" src="https://dweb.link/ipfs/bafybeibxxjaqghf3j75iruk5k2qnytihqogu335yciqlkuncjai6kt7tiq/upgradeable-clones.drawio.svg">
</div>
### Clone the Repository

```Solidity
git clone --recursive https://github.com/0xhamedETH/hardhat-ethers-upgradeable-minimal-clones-campman.git your-directory
```

### Install Packages

```Solidity
cd your-directory/ethereum
npm install
```

### Compile

Compile first to create json artifacts in `artifacts` folder

```Solidity
npx hardhat compile
```

### Test

You can test contracts either separately or totally.

```Solidity
npx hardhat test --network hardhat
npx hardhat test test/FactoryV1.test.js  --network hardhat
npx hardhat test test/Campaign.test.js --network hardhat
npx hardhat test test/Token.test.js --network hardhat
npx hardhat test test/Pool.test.js --network hardhat
```

### Deploy

For this step, you first need to fill `.env` file with your api keys (`Alchemy`, ...)

`Scripts` folder is resposible for deploying contracts.

You can deploy in any network you want but make sure `hardhat.config.js` contains that network, otherwise add it.

**Note:** Make sure you fill config section of `deploy_Factory_v1.js` correctly.

**Note:** You can change `buildPath` of output json file containing abi, bytecode, ... .

#### Deploy FactoryV1:

Before factory contract, 3 separate contracts (Campaign, Token & Pool) wiil deploy first and their addresses will pass as arguments to factory contract to use as master functionality contracts for minimal clone deployment.

```Solidity
npx hardhat run scripts/deploy_Factory_v1.js --network rinkeby
```

#### Verify Contracts

**Note:** Make sure you provide your network explorer `apiKey` in `hardhat.config.js`.

1.  **Implementation:** You need to verify `Implementation` contract by yourself to be able to see the source code on Network Explorer (in this case `Rinkeby Testnet Explorer: Etherscan`)

```Solidity
npx hardhat verify --network rinkeby implementationContractAddress
```

2.  **TransparentUpgradeableProxy:** To verify this contract as proxy, you need to follow these steps:

- Go to `Etherscan` and search the `TransparentUpgradeableProxy` contract address
- Go to `Contract` tab `>` More Options `>` Is this a proxy? `>` Verify

3.  **ProxyAdmin:** This contract is already verified.

#### Upgrade to FactoryV2

For upgrade, make sure you fill `proxyAddress` in `config` section of `upgrade_Factory_v2` script.

```Solidity
npx hardhat run scripts/upgrade_Factory_v2.js --network rinkeby
```

After this, 2 transactions will send:

**1st** to deploy new `Implementation` contract

**2nd** to call `upgrade` function of `ProxyAdmin` contract.

## Give a Star! :star:

If you like or use this project, please give it a star. Thanks !!!
