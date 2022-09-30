import { GroupGameFunction } from '../enums/group-game-function.js';
import{GroupGamePayload} from '../interfaces/group-game-payload.js'

export class DataAccess{

private _gameSocket:WebSocket;

private _startGroupGameEndpoint:string ='https://5c7skzyfq2.execute-api.us-east-1.amazonaws.com/default/create-group-game';

private _gameSocketEndpoint:string='wss://piz3bjhjvc.execute-api.us-east-1.amazonaws.com/Prod';

public  StartGroupGame(gameId:string,playerId:string):Promise<Response>{

    return fetch(`${this._startGroupGameEndpoint}`, {
        mode:'no-cors',
          method: 'post',
          headers: {
          },
          body: JSON.stringify({gameId,playerId})
        });

}
public InvokeSocketConnection(gameId:string,playerId:string, role:string){
    
    this._gameSocket = new WebSocket(`${this._gameSocketEndpoint}?game=${gameId}`);

    this._gameSocket.onerror=(event:MessageEvent<any>)=>{
        let socketEvent = new CustomEvent("socketError");
        document.dispatchEvent(socketEvent);
    }

    this._gameSocket.onopen=(event:MessageEvent<any>)=>{
        let socketEvent = new CustomEvent("socketOpen");
        document.dispatchEvent(socketEvent);
    }

    this._gameSocket.onmessage =  (event:MessageEvent<any>)=> {

        let payload:GroupGamePayload = JSON.parse(event.data);
        let socketEvent = new CustomEvent("socketEvent",{detail: payload});
        document.dispatchEvent(socketEvent);
    };

    this._gameSocket.onopen= (event:MessageEvent<any>)=> {

    const startObj:GroupGamePayload = {
        action:'sendmessage',
        function: GroupGameFunction.PlayerName,
        data:playerId,
        playerRole:role,
        game:gameId.toLowerCase()
    }

    this.SendGameMessage(startObj);

    };
}

public InvokeSocketGameStart(word:string, game:string){

    const startObj:GroupGamePayload = {
        action:'sendmessage',
        function: GroupGameFunction.GameStart,
        data:word,
        game:game
    }

    this.SendGameMessage(startObj);
}

public InvokeSocketGameEnd(game:string){

    const startObj:GroupGamePayload = {
        action:'sendmessage',
        function: GroupGameFunction.GameEnd,
        game:game
    }

    this.SendGameMessage(startObj);
}

public InvokeSocketWordGuessed(word:string, playerName:string, game:string, score:number){

    const startObj:GroupGamePayload = {
        action:'sendmessage',
        function: GroupGameFunction.WordGuessed,
        data:word,
        game:game,
        playerName:playerName,
        score:score
    }

    this.SendGameMessage(startObj);
}


public SendGameMessage(payloadObj:GroupGamePayload):void{

    const payload = JSON.stringify(payloadObj);
    this._gameSocket.send(payload);
}

}