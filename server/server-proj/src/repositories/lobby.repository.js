import Player from "../models/Player.js";

export default class LobbyRepository {
    constructor() {
        this.players = {};
        this.isGameStarted = false;
        this.hostPlayerId = null;
    }

    addPlayer(username) {
        
        
        let player = new Player(username);
        if (this.players[player.id]) {
            throw new Error('Player with id ' + player.id + ' already exists in the lobby');
        }

        this.players[player.id] = player;
        return player.id;
    }

    removePlayer(playerId) {
        if (!this.players[playerId]) {
            throw new Error('Player with id ' + playerId + ' does not exist in the lobby');
        }
        delete this.players[playerId];

        // if(this.hostPlayerId === playerId) {
        //     this.hostPlayerId = null;
        //     const remainingPlayerIds = Object.keys(this.players);
        //     if (remainingPlayerIds.length > 0) {
        //         this.setHostPlayer(remainingPlayerIds[0]);
        //     }
        // }

        if (this.getLobbySize() === 0) {
            this.reset();
        }
    }

    getPlayer(playerId) {
        return this.players[playerId];
    }

    getLobbySize() {
        return Object.keys(this.players).length;
    }

    setHostPlayer(playerId) {
        if (!this.players[playerId]) {
            throw new Error('Player with id ' + playerId + ' does not exist in the lobby');
        }
        this.hostPlayerId = playerId;
    }

    getHostPlayer() {
        if (!this.hostPlayerId) {
            return null;
        }
        return this.players[this.hostPlayerId];
    }

    reset() {
        this.players = {};
        this.isGameStarted = false;
        this.hostPlayerId = null;
    }

}