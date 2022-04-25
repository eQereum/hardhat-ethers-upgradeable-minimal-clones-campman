// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract Token is Initializable, ERC20Upgradeable {
    // slots 0 - 4: for ERC20

    // slot 5: 20bytes
    address public manager;

    // slot 6: 21 bytes
    address payable public campaignAddress;
    bool internal locked;

    // constructor(
    //     string memory _name,
    //     string memory _symbol,
    //     address payable _campaignAddress,
    //     address _manager
    // ) ERC20(_name, _symbol) {
    //     manager = _manager;
    //     campaignAddress = _campaignAddress;
    // }

    function initialize(
        string memory _name,
        string memory _symbol,
        address payable _campaignAddress,
        address _manager
    ) public initializer {
        manager = _manager;
        campaignAddress = _campaignAddress;
        __ERC20_init(_name, _symbol);
    }

    modifier noReentrant() {
        require(!locked, 'No re-entrancy');
        locked = true;
        _;
        locked = false;
    }

    function mint(address caller, uint128 contributionAmount) external noReentrant {
        require(msg.sender == campaignAddress, 'only campaign can mint tokens');
        _mint(caller, uint256(contributionAmount * 100));
    }
}
