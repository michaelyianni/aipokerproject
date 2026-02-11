export default class LobbyController {
    constructor(lobbyRepository) {
        this.lobbyRepository = lobbyRepository;
    }


    lobbyJoin(username) {

        this.validateLobbyJoin(username);

        if (!username || username.trim() === "") {
            username = "Player" + (this.lobbyRepository.getLobbySize() + 1);
        }

        const lobbySizeBefore = this.lobbyRepository.getLobbySize();
        const playerId = this.lobbyRepository.addPlayer(username);

        const isHost = lobbySizeBefore === 0;

        return {
            playerId,
            isHost,
            lobby: { ...this.lobbyRepository.players },
        };
        

    }

    validateLobbyJoin(username) {
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
        
        this.lobbyRepository.isGameStarted = true;


    }

}