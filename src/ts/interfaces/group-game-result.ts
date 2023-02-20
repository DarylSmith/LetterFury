import { GroupGameStatus } from "../enums/group-game-status";

export interface GroupGameResult{
    player?:string,
    event:string;
    action:string;
    word?:string;
    value?: any;
    status?:GroupGameStatus;
    standings?:[];
    allPlayers?:[];
    
    }