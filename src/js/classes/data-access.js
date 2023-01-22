import { GroupGameFunction } from '../enums/group-game-function.js';
export class DataAccess {
    constructor() {
        this._startGroupGameEndpoint = 'https://5c7skzyfq2.execute-api.us-east-1.amazonaws.com/default/create-group-game';
        this._gameSocketEndpoint = 'wss://piz3bjhjvc.execute-api.us-east-1.amazonaws.com/Prod';
    }
    StartGroupGame(gameId, playerId) {
        return fetch(`${this._startGroupGameEndpoint}`, {
            mode: 'no-cors',
            method: 'post',
            headers: {},
            body: JSON.stringify({ gameId, playerId })
        });
    }
    CloseSocket() {
        this._gameSocket.close();
    }
    InvokeSocketConnection(gameId, playerId, role) {
        this._gameSocket = new WebSocket(`${this._gameSocketEndpoint}?game=${gameId}&role=${role}`);
        this._gameSocket.onerror = (event) => {
            let socketEvent = new CustomEvent("socketError");
            document.dispatchEvent(socketEvent);
        };
        this._gameSocket.onopen = (event) => {
            let socketEvent = new CustomEvent("socketOpen");
            document.dispatchEvent(socketEvent);
        };
        this._gameSocket.onmessage = (event) => {
            let payload = JSON.parse(event.data);
            console.log(payload);
            let socketEvent = new CustomEvent("socketEvent", { detail: payload });
            document.dispatchEvent(socketEvent);
        };
        this._gameSocket.onopen = (event) => {
            const startObj = {
                action: 'sendmessage',
                function: GroupGameFunction.PlayerName,
                data: playerId,
                playerRole: role,
                game: gameId.toLowerCase()
            };
            this.SendGameMessage(startObj);
        };
    }
    InvokeSocketGameStart(word, game) {
        const startObj = {
            action: 'sendmessage',
            function: GroupGameFunction.GameStart,
            data: word,
            game: game
        };
        this.SendGameMessage(startObj);
    }
    InvokeSocketGameEnd(game) {
        const startObj = {
            action: 'sendmessage',
            function: GroupGameFunction.GameEnd,
            game: game
        };
        this.SendGameMessage(startObj);
    }
    InvokeSocketWordGuessed(guessedWord, nextWord, playerName, game, score) {
        const startObj = {
            action: 'sendmessage',
            function: GroupGameFunction.WordGuessed,
            data: nextWord,
            game: game,
            playerName: playerName,
            score: score,
            guessedWord: guessedWord
        };
        this.SendGameMessage(startObj);
    }
    SendGameMessage(payloadObj) {
        const payload = JSON.stringify(payloadObj);
        this._gameSocket.send(payload);
    }
}
