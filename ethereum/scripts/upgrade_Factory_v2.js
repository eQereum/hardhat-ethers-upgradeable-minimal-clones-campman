const { ethers, upgrades } = require('hardhat');
const path = require('path');
const fs = require('fs-extra');

// ----------------------------------------------------- config -----------------------------------------------------
const projectName = 'FactoryV2';
const projectVersion = '2.0';
const contractName = 'FactoryV2';
const networkName = 'rinkeby';
const pathSource = `./artifacts/contracts/FactoryV2/FactoryV2.sol/FactoryV2.json`;
const proxyAddress = 'fill with TransparentUpgradeableProxy contract address';
const buildPath = path.resolve(__dirname, '../../client/src/contracts');
// ------------------------------------------------------------------------------------------------------------------

const main = async () => {
  const [deployer] = await ethers.getSigners();

  const newImplementation = await ethers.getContractFactory(contractName);
  console.log('Deploying Implementation Contract Factory ...');
  const proxy = await upgrades.upgradeProxy(proxyAddress, newImplementation);
  console.log(`Proxy version ${projectVersion} deployed to:`, proxy.address);

  const proxyContractAddress = JSON.parse(JSON.stringify(proxy.address));
  const owner = JSON.parse(JSON.stringify(proxy.deployTransaction.from));
  const networkId = JSON.parse(JSON.stringify(proxy.deployTransaction.chainId));
  const deployProxyTrancationHash = JSON.parse(JSON.stringify(proxy.deployTransaction.hash));

  makeOutputSummary(pathSource, proxyContractAddress, owner, networkId, deployProxyTrancationHash);
};

const makeOutputSummary = (pathSource, proxyContractAddress, owner, networkId, deployProxyTrancationHash) => {
  let readableSource = fs.readFileSync(pathSource, 'utf8');
  readableSource = JSON.parse(readableSource);

  // fs.removeSync(buildPath);
  fs.ensureDirSync(buildPath);

  var input = {
    language: 'Solidity',
    contractName: `ProxyProject_${projectName}v${projectVersion}`,
    proxyContractAddress: proxyContractAddress,
    onwer: owner,
    networkId: networkId,
    networkName: networkName,
    deployProxyTrancationHash: deployProxyTrancationHash,
    abi: readableSource.abi,
    bytecode: readableSource.bytecode,
    sourcePath: readableSource.sourceName,
    settings: {
      optimizer: {
        enabled: true,
      },
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  let output = JSON.parse(JSON.stringify(input));
  const jsonOutput = fs.outputJsonSync(path.resolve(buildPath, `${projectName}-v${projectVersion}-${networkName}.json`), output);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
