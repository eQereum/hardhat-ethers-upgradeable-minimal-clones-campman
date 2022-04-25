// SPDX-License-Identifier: MIT
import '../Pool.sol';
import '../Token.sol';
import './ICampaign.sol';
import '../CloneFactory.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

pragma solidity ^0.8.13;

abstract contract CampaignStates is Initializable, ICampaign, CloneFactory {
    address payable public owner;
    uint64 public minimumContribution;
    uint32 public campaignCreationTime;
    address payable public factory;
    uint32 public contributionPeriod;
    uint32 public requestApprovalPeriod;
    bytes32 public campaignName;
    address public manager;
    uint16 public investorsCount;
    uint16 public requestsCount;
    bool public isRejectedByOwner;
    bool public isClosed;
    bool internal locked;
    uint128 public totalContribution;
    uint128 public totalRequestValues;
    address payable public campaignTokenAddress;
    address public poolCloneFactoryAddress;
    address public PoolAddress;
    uint128 public availableBalance;
    string public bannerIPFS;
    string public campaignDescription;
    mapping(address => bool) public isInvestor;
    mapping(address => uint128) public contributionPerInvestor;
    mapping(uint16 => Request) public requests;
}
