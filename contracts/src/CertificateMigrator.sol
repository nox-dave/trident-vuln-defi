// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./Certificate.sol";
import "./ProgressTracker.sol";

contract CertificateMigrator {
    Certificate public immutable certificate;
    ProgressTracker public immutable oldProgressTracker;
    address public owner;
    
    mapping(address => bool) public migrated;
    
    error Unauthorized();
    error AlreadyMigrated();
    
    constructor(address _certificate, address _oldProgressTracker) {
        certificate = Certificate(_certificate);
        oldProgressTracker = ProgressTracker(_oldProgressTracker);
        owner = msg.sender;
    }
    
    function migrateUser(address user) external {
        if (msg.sender != owner) revert Unauthorized();
        if (migrated[user]) revert AlreadyMigrated();
        
        migrated[user] = true;
        
        uint256 solvedCount = oldProgressTracker.getSolvedCount(user);
        
        if (solvedCount >= 5) {
            uint256 tokenId = certificate.getTokenIdForMilestone(5);
            if (!certificate.hasCertificate(user, tokenId)) {
                certificate.mint(user, tokenId);
            }
        }
        
        if (solvedCount >= 10) {
            uint256 tokenId = certificate.getTokenIdForMilestone(10);
            if (!certificate.hasCertificate(user, tokenId)) {
                certificate.mint(user, tokenId);
            }
        }
        
        if (solvedCount >= 20) {
            uint256 tokenId = certificate.getTokenIdForMilestone(20);
            if (!certificate.hasCertificate(user, tokenId)) {
                certificate.mint(user, tokenId);
            }
        }
    }
    
    function migrateMultipleUsers(address[] calldata users) external {
        if (msg.sender != owner) revert Unauthorized();
        
        for (uint256 i = 0; i < users.length; i++) {
            if (!migrated[users[i]]) {
                migrated[users[i]] = true;
                
                uint256 solvedCount = oldProgressTracker.getSolvedCount(users[i]);
                
                if (solvedCount >= 5) {
                    uint256 tokenId = certificate.getTokenIdForMilestone(5);
                    if (!certificate.hasCertificate(users[i], tokenId)) {
                        certificate.mint(users[i], tokenId);
                    }
                }
                
                if (solvedCount >= 10) {
                    uint256 tokenId = certificate.getTokenIdForMilestone(10);
                    if (!certificate.hasCertificate(users[i], tokenId)) {
                        certificate.mint(users[i], tokenId);
                    }
                }
                
                if (solvedCount >= 20) {
                    uint256 tokenId = certificate.getTokenIdForMilestone(20);
                    if (!certificate.hasCertificate(users[i], tokenId)) {
                        certificate.mint(users[i], tokenId);
                    }
                }
            }
        }
    }
}

