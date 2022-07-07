export  interface GroupGame{

    IsGroupGame:boolean;
    GroupGameName:string;
    GroupUserName:string;
    GroupUserStatus:"host"| "player"|null;
    GroupUserConnected:boolean;
    GroupGameStatus:"notstarted"|"inprogress"|"completed";
}