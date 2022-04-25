// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICampaign {
    struct CampaignSummary {
        bytes32 campaignName;
        uint32 campaignCreationTime;
        uint32 contributionPeriod;
        uint16 requestsCount;
        uint16 investorsCount;
        uint256 totalContribution;
        uint128 availableBalance;
        uint128 balance;
        address manager;
        uint64 minimumContribution;
        bool isClosed;
        bool isRejectedByOwner;
        address campaignTokenAddress;
        address poolAddress;
        string campaignDescription;
        string bannerIPFS;
    }

    struct Request {
        string description;
        uint128 value;
        address payable recipient;
        bool isComplete;
        bool isCancel;
        uint32 approversCount;
        mapping(address => bool) wasApproved;
        uint256 requestCreationTime;
    }

    event ContributionLog(uint128 indexed value, address indexed investor);
    event CreateRequestLog(uint128 value, string description, address recipient);
    event ApproveRequestLog(uint16 index, address approver);
    event FinalizeRequestLog(uint16 index, address recipient);
    event CancelRequestLog(uint16 index);
    event CreatePoolLog(string message, address indexed rejectedAddress, address indexed poolAddress);

    function contribute() external payable;

    function createRequest(
        string memory description,
        uint128 value,
        address payable recipient
    ) external;

    function approveRequest(uint16 index) external;

    function finalizeRequest(uint16 index) external;

    function cancelRequest(uint16 index) external;

    function getSummary() external view returns (CampaignSummary memory);

    function rejectCampaign() external returns (address poolAddress);
}
