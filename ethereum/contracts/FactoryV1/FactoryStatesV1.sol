// SPDX-License-Identifier: MIT

import './IFactoryV1.sol';
import '../Campaign/Campaign.sol';
import '../CloneFactory.sol';

pragma solidity ^0.8.13;

abstract contract FactoryStatesV1 is IFactoryV1, CloneFactory {
    address[] public Campaigns;
    FactoryStatus public factoryStatus;
    CloneStatus public cloneStatus;
    mapping(address => CampaignStatus) public campaignStatus;
    mapping(address => ManagerStatus) public managerStatus;
}
