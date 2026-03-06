export default class LobbyController {
    constructor(lobbyRepository) {
        this.lobbyRepository = lobbyRepository;
    }


    lobbyJoin(username) {

        this.validateLobbyJoin();

        if (!username || username.trim() === "") {
            username = "Player" + (this.lobbyRepository.getLobbySize() + 1);
        }

        const lobbySizeBefore = this.lobbyRepository.getLobbySize();
        const playerId = this.lobbyRepository.addPlayer(username);

        const isHost = lobbySizeBefore === 0;
        if (isHost) {
            this.lobbyRepository.setHostPlayer(playerId);
        }

        return {
            playerId,
            isHost,
            lobby: { ...this.lobbyRepository.getLobbyState() },
        };
        

    }

    validateLobbyJoin() {
        if (this.lobbyRepository.getLobbySize() >= 6) {
            throw new Error('Lobby is full');
        }
        if (this.lobbyRepository.isGameStarted) {
            throw new Error('Game has already started');
        }
        return true;
    }

    lobbyStart(isHost) {
        if (this.lobbyRepository.isGameStarted) {
            throw new Error('Game has already started');
        }

        if (!isHost) {
            throw new Error('Only the host can start the game');
        }

        if (this.lobbyRepository.getLobbySize() < 2) {
            throw new Error('At least 2 players are required to start the game');
        }
        
        this.lobbyRepository.isGameStarted = true;


    }

}