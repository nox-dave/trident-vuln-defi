// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./Certificate.sol";

contract ProgressTracker {
    address public immutable factory;
    Certificate public immutable certificate;
    mapping(address => mapping(uint256 => bool)) private solved;
    mapping(address => uint256) private solvedCount;
    
    uint256[] private milestones;

    error Unauthorized();

    event ChallengeSolved(
        address indexed user,
        uint256 indexed challengeId,
        uint256 timestamp
    );

    event CertificateAwarded(
        address indexed user,
        uint256 indexed tokenId,
        uint256 milestone
    );

    constructor(address _factory, address _certificate) {
        factory = _factory;
        certificate = Certificate(_certificate);
        milestones = [5, 10, 20];
    }

    function hasSolved(
        address user,
        uint256 challengeId
    ) external view returns (bool) {
        return solved[user][challengeId];
    }

    function getSolvedCount(address user) external view returns (uint256) {
        return solvedCount[user];
    }

    function recordSolution(address user, uint256 challengeId) external {
        if (msg.sender != factory) revert Unauthorized();

        if (!solved[user][challengeId]) {
            solved[user][challengeId] = true;
            unchecked {
                solvedCount[user]++;
            }
            emit ChallengeSolved(user, challengeId, block.timestamp);
            
            uint256 newCount = solvedCount[user];
            
            for (uint256 i = 0; i < milestones.length; i++) {
                if (newCount == milestones[i]) {
                    uint256 tokenId = certificate.getTokenIdForMilestone(milestones[i]);
                    if (!certificate.hasCertificate(user, tokenId)) {
                        certificate.mint(user, tokenId);
                        emit CertificateAwarded(user, tokenId, milestones[i]);
                    }
                    break;
                }
            }
        }
    }
}
