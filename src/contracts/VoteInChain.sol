// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VoteInChain
 * @dev Contrat de vote décentralisé avec whitelist et gestion des sessions
 */
contract VoteInChain {
    struct Candidate {
        uint256 id;
        string name;
        string description;
        string party;
        string imageUrl;
        uint256 voteCount;
        bool isActive;
    }
    
    struct VotingSession {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
        uint256[] candidateIds;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voterChoice;
    }
    
    struct Vote {
        address voter;
        uint256 sessionId;
        uint256 candidateId;
        uint256 timestamp;
        string candidateName;
    }
    
    address public admin;
    uint256 public candidateCount;
    uint256 public sessionCount;
    
    // Mappings
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => VotingSession) public votingSessions;
    mapping(address => bool) public whitelist;
    mapping(address => bool) public isEligibleVoter;
    
    // Arrays pour itération
    address[] public whitelistedVoters;
    uint256[] public activeSessions;
    
    // Events pour MetaMask et synchronisation
    event VoteCast(
        address indexed voter,
        uint256 indexed sessionId,
        uint256 indexed candidateId,
        uint256 timestamp,
        string candidateName,
        bytes32 voteHash
    );
    
    event CandidateAdded(
        uint256 indexed candidateId,
        string name,
        string description,
        string party
    );
    
    event VotingSessionCreated(
        uint256 indexed sessionId,
        string title,
        uint256 startTime,
        uint256 endTime,
        uint256[] candidateIds
    );
    
    event VotingSessionToggled(
        uint256 indexed sessionId,
        bool isActive,
        uint256 timestamp
    );
    
    event VoterWhitelisted(
        address indexed voter,
        uint256 timestamp,
        address indexed admin
    );
    
    event VoterRemovedFromWhitelist(
        address indexed voter,
        uint256 timestamp,
        address indexed admin
    );
    
    event AdminChanged(
        address indexed oldAdmin,
        address indexed newAdmin,
        uint256 timestamp
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Seul l'administrateur peut effectuer cette action");
        _;
    }
    
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Vous n'etes pas autorise a voter");
        _;
    }
    
    modifier sessionExists(uint256 _sessionId) {
        require(_sessionId > 0 && _sessionId <= sessionCount, "Session inexistante");
        _;
    }
    
    modifier sessionActive(uint256 _sessionId) {
        require(votingSessions[_sessionId].isActive, "Session inactive");
        require(
            block.timestamp >= votingSessions[_sessionId].startTime,
            "Le vote n'a pas encore commence"
        );
        require(
            votingSessions[_sessionId].endTime == 0 || 
            block.timestamp <= votingSessions[_sessionId].endTime,
            "Le vote est termine"
        );
        _;
    }
    
    modifier validCandidate(uint256 _sessionId, uint256 _candidateId) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Candidat invalide");
        require(candidates[_candidateId].isActive, "Candidat inactif");
        
        // Vérifier que le candidat fait partie de cette session
        bool candidateInSession = false;
        uint256[] memory sessionCandidates = votingSessions[_sessionId].candidateIds;
        for (uint256 i = 0; i < sessionCandidates.length; i++) {
            if (sessionCandidates[i] == _candidateId) {
                candidateInSession = true;
                break;
            }
        }
        require(candidateInSession, "Candidat non disponible pour cette session");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        candidateCount = 0;
        sessionCount = 0;
        
        // L'admin est automatiquement whitelisté
        whitelist[admin] = true;
        isEligibleVoter[admin] = true;
        whitelistedVoters.push(admin);
    }
    
    /**
     * @dev Ajouter un candidat
     */
    function addCandidate(
        string memory _name,
        string memory _description,
        string memory _party,
        string memory _imageUrl
    ) public onlyAdmin {
        require(bytes(_name).length > 0, "Le nom du candidat ne peut pas etre vide");
        
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            description: _description,
            party: _party,
            imageUrl: _imageUrl,
            voteCount: 0,
            isActive: true
        });
        
        emit CandidateAdded(candidateCount, _name, _description, _party);
    }
    
    /**
     * @dev Créer une session de vote
     */
    function createVotingSession(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        uint256[] memory _candidateIds
    ) public onlyAdmin {
        require(bytes(_title).length > 0, "Le titre ne peut pas etre vide");
        require(_candidateIds.length > 0, "Au moins un candidat requis");
        require(_startTime >= block.timestamp, "La date de debut doit etre dans le futur");
        require(_endTime == 0 || _endTime > _startTime, "Date de fin invalide");
        
        // Vérifier que tous les candidats existent
        for (uint256 i = 0; i < _candidateIds.length; i++) {
            require(
                _candidateIds[i] > 0 && _candidateIds[i] <= candidateCount,
                "Candidat invalide"
            );
            require(candidates[_candidateIds[i]].isActive, "Candidat inactif");
        }
        
        sessionCount++;
        VotingSession storage newSession = votingSessions[sessionCount];
        newSession.id = sessionCount;
        newSession.title = _title;
        newSession.description = _description;
        newSession.startTime = _startTime;
        newSession.endTime = _endTime;
        newSession.isActive = true;
        newSession.totalVotes = 0;
        newSession.candidateIds = _candidateIds;
        
        activeSessions.push(sessionCount);
        
        emit VotingSessionCreated(sessionCount, _title, _startTime, _endTime, _candidateIds);
    }
    
    /**
     * @dev Voter pour un candidat dans une session
     */
    function vote(uint256 _sessionId, uint256 _candidateId) 
        public 
        onlyWhitelisted
        sessionExists(_sessionId)
        sessionActive(_sessionId)
        validCandidate(_sessionId, _candidateId)
    {
        require(!votingSessions[_sessionId].hasVoted[msg.sender], "Vous avez deja vote dans cette session");
        
        // Enregistrer le vote
        votingSessions[_sessionId].hasVoted[msg.sender] = true;
        votingSessions[_sessionId].voterChoice[msg.sender] = _candidateId;
        votingSessions[_sessionId].totalVotes++;
        
        // Incrémenter le compteur du candidat
        candidates[_candidateId].voteCount++;
        
        // Générer un hash unique pour ce vote
        bytes32 voteHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _sessionId,
                _candidateId,
                block.timestamp,
                block.number
            )
        );
        
        // Émettre l'événement pour MetaMask et synchronisation
        emit VoteCast(
            msg.sender,
            _sessionId,
            _candidateId,
            block.timestamp,
            candidates[_candidateId].name,
            voteHash
        );
    }
    
    /**
     * @dev Ajouter un électeur à la whitelist
     */
    function addToWhitelist(address _voter) public onlyAdmin {
        require(_voter != address(0), "Adresse invalide");
        require(!whitelist[_voter], "Deja dans la whitelist");
        
        whitelist[_voter] = true;
        isEligibleVoter[_voter] = true;
        whitelistedVoters.push(_voter);
        
        emit VoterWhitelisted(_voter, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Ajouter plusieurs électeurs à la whitelist
     */
    function addMultipleToWhitelist(address[] memory _voters) public onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !whitelist[_voters[i]]) {
                whitelist[_voters[i]] = true;
                isEligibleVoter[_voters[i]] = true;
                whitelistedVoters.push(_voters[i]);
                
                emit VoterWhitelisted(_voters[i], block.timestamp, msg.sender);
            }
        }
    }
    
    /**
     * @dev Retirer un électeur de la whitelist
     */
    function removeFromWhitelist(address _voter) public onlyAdmin {
        require(whitelist[_voter], "Pas dans la whitelist");
        require(_voter != admin, "Impossible de retirer l'admin");
        
        whitelist[_voter] = false;
        isEligibleVoter[_voter] = false;
        
        // Retirer de la liste des électeurs
        for (uint256 i = 0; i < whitelistedVoters.length; i++) {
            if (whitelistedVoters[i] == _voter) {
                whitelistedVoters[i] = whitelistedVoters[whitelistedVoters.length - 1];
                whitelistedVoters.pop();
                break;
            }
        }
        
        emit VoterRemovedFromWhitelist(_voter, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Basculer l'état d'une session de vote
     */
    function toggleVotingSession(uint256 _sessionId) 
        public 
        onlyAdmin 
        sessionExists(_sessionId) 
    {
        votingSessions[_sessionId].isActive = !votingSessions[_sessionId].isActive;
        
        emit VotingSessionToggled(
            _sessionId,
            votingSessions[_sessionId].isActive,
            block.timestamp
        );
    }
    
    /**
     * @dev Obtenir les informations d'une session
     */
    function getVotingSession(uint256 _sessionId) 
        public 
        view 
        sessionExists(_sessionId)
        returns (
            uint256 id,
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            uint256 totalVotes,
            uint256[] memory candidateIds
        ) 
    {
        VotingSession storage session = votingSessions[_sessionId];
        return (
            session.id,
            session.title,
            session.description,
            session.startTime,
            session.endTime,
            session.isActive,
            session.totalVotes,
            session.candidateIds
        );
    }
    
    /**
     * @dev Vérifier si un utilisateur a voté dans une session
     */
    function hasUserVotedInSession(address _voter, uint256 _sessionId) 
        public 
        view 
        sessionExists(_sessionId)
        returns (bool) 
    {
        return votingSessions[_sessionId].hasVoted[_voter];
    }
    
    /**
     * @dev Obtenir le choix de vote d'un utilisateur dans une session
     */
    function getUserVoteInSession(address _voter, uint256 _sessionId) 
        public 
        view 
        sessionExists(_sessionId)
        returns (uint256) 
    {
        require(votingSessions[_sessionId].hasVoted[_voter], "L'utilisateur n'a pas vote");
        return votingSessions[_sessionId].voterChoice[_voter];
    }
    
    /**
     * @dev Obtenir tous les candidats
     */
    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            allCandidates[i-1] = candidates[i];
        }
        return allCandidates;
    }
    
    /**
     * @dev Obtenir les candidats d'une session
     */
    function getSessionCandidates(uint256 _sessionId) 
        public 
        view 
        sessionExists(_sessionId)
        returns (Candidate[] memory) 
    {
        uint256[] memory candidateIds = votingSessions[_sessionId].candidateIds;
        Candidate[] memory sessionCandidates = new Candidate[](candidateIds.length);
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            sessionCandidates[i] = candidates[candidateIds[i]];
        }
        
        return sessionCandidates;
    }
    
    /**
     * @dev Obtenir toutes les sessions actives
     */
    function getActiveSessions() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < activeSessions.length; i++) {
            if (votingSessions[activeSessions[i]].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory activeSessionIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activeSessions.length; i++) {
            if (votingSessions[activeSessions[i]].isActive) {
                activeSessionIds[index] = activeSessions[i];
                index++;
            }
        }
        
        return activeSessionIds;
    }
    
    /**
     * @dev Obtenir la liste des électeurs whitelistés
     */
    function getWhitelistedVoters() public view returns (address[] memory) {
        return whitelistedVoters;
    }
    
    /**
     * @dev Vérifier si une adresse est whitelistée
     */
    function isWhitelisted(address _voter) public view returns (bool) {
        return whitelist[_voter];
    }
    
    /**
     * @dev Obtenir les résultats d'une session
     */
    function getSessionResults(uint256 _sessionId) 
        public 
        view 
        sessionExists(_sessionId)
        returns (
            uint256[] memory candidateIds,
            string[] memory names,
            uint256[] memory voteCounts,
            uint256 totalVotes
        ) 
    {
        uint256[] memory sessionCandidateIds = votingSessions[_sessionId].candidateIds;
        uint256 length = sessionCandidateIds.length;
        
        candidateIds = new uint256[](length);
        names = new string[](length);
        voteCounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 candidateId = sessionCandidateIds[i];
            candidateIds[i] = candidateId;
            names[i] = candidates[candidateId].name;
            voteCounts[i] = candidates[candidateId].voteCount;
        }
        
        totalVotes = votingSessions[_sessionId].totalVotes;
    }
    
    /**
     * @dev Changer l'administrateur
     */
    function changeAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Adresse invalide");
        require(_newAdmin != admin, "Meme administrateur");
        
        address oldAdmin = admin;
        admin = _newAdmin;
        
        // Ajouter le nouvel admin à la whitelist
        if (!whitelist[_newAdmin]) {
            whitelist[_newAdmin] = true;
            isEligibleVoter[_newAdmin] = true;
            whitelistedVoters.push(_newAdmin);
        }
        
        emit AdminChanged(oldAdmin, _newAdmin, block.timestamp);
    }
    
    /**
     * @dev Obtenir les statistiques générales
     */
    function getGeneralStats() public view returns (
        uint256 totalCandidates,
        uint256 totalSessions,
        uint256 totalWhitelistedVoters,
        uint256 totalVotesAllSessions
    ) {
        totalCandidates = candidateCount;
        totalSessions = sessionCount;
        totalWhitelistedVoters = whitelistedVoters.length;
        
        // Calculer le total des votes de toutes les sessions
        totalVotesAllSessions = 0;
        for (uint256 i = 1; i <= sessionCount; i++) {
            totalVotesAllSessions += votingSessions[i].totalVotes;
        }
    }
}