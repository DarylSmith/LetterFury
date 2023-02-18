import { DataAccess } from './classes/data-access.js';
import { IntroJson } from './classes/IntroJsonItem.js';
import {WordsEn} from './classes/words-en.js'
import { GroupGameFunction } from './enums/group-game-function.js';
import { LetterFuryKeyboard } from './classes/lf-keyboard.js';
import { GroupGameResult } from './interfaces/group-game-result.js';
import { GroupGame } from './interfaces/group-game.js';
import { LfIntro } from './classes/lf-intro.js';
import { GroupGameStatus } from './enums/group-game-status.js';
import { ScoreItem } from './interfaces/score-item.js';
import { Standings } from './interfaces/standings.js';

export class LetterFury{

    //abbreviates the native DOM selector for easier use
    public $q:any = document.querySelector.bind(document)!;
    
	// holds high scores retrived from endoint
	public HighScores:any[]= [];

    public ListOfWords:string[]=WordsEn().filter(e=>e.usedInGame).map(e=>e.word);

	public AcceptableWords:string[]=WordsEn().map(e=>e.word);
	
	// endoint for  retrieving high scores. TODO add to config file
	public HighScoresEndpoint:string = 'https://6dmnrf7ylc.execute-api.us-east-1.amazonaws.com/default';
	
	//Random Word generated for game
	public OurRandomWord:string = '';// 
	private OurPreviousRandomWord:string='';
	
	//container for each chance per random number
	public ListOfChances:any[]= [];

	public keyboard = new LetterFuryKeyboard();

	public introJson = new LfIntro();

	//Number of times a player guesses during a turn. TODO: make this private
	public PlayerScore:number =  0;

	// Counter for the intro (rules)
	public IntroIndex:number = 1;

	// number of times a word can be skipped
	public SkipsAllowed:number = 3;
	
    public NumberOfSkips:number = 0;

    public wordIntervalArr:any={};

	public FinalScoreQueue:ScoreItem[]=[];
	public FinalScoreIndex=1;

    private _dataAccess = new DataAccess();

	private readonly _wordLength=3;

    
	// if set to true, outputs comments about game logic to console
	private _testMode:boolean =false;

	constructor(){

		//if this is a group game invite, parse now
		if(window.location.hash.includes('gameid'))
		{
			const gameId = window.location.hash.split('=')[1];
			this.GroupGame.GroupGameName=gameId;
			console.log(`Group game is ${this.GroupGame.GroupGameName}`);
			
		}

		document.addEventListener('socketEvent', (event:CustomEvent)=>{
		const details = event.detail as GroupGameResult;
		switch(details.event){
			case GroupGameFunction.PlayerName:
					this.WritePlayersToGroupScreen(details);
				break;
			case GroupGameFunction.GameStart:
				this.RemoveLoadingIcon( this.$q("#inputContainer"),"lds-facebook");
				this.$q("#inputContainerInner").style.display="block";
				this.OurRandomWord = details.word;
				this.GroupGame.IsGroupGame=true;
				this.GroupGame.GroupGameStatus="inprogress";
				this.InitGame();
			case GroupGameFunction.WordGuessed:
				//this.WriteToConsole( `${details.player} successfully guessed ${this.OurRandomWord.toLowerCase() }`);
				this.InvokeGroupPointAwarded(details);
			
				let index = 0;
				if(details.player!==this.GroupGame.GroupUserName){
						(window as any).WordInput = (window as any).setInterval(() => {
							index++;
					
		
						}, 40);
				}
				this.StartNextRound(false);
				break;
			case GroupGameFunction.GameEnd:
				this.GroupGameEnd(details.value, details.standings);
			break;
			case GroupGameFunction.PlayerDisconnect:
				if(details.status ===GroupGameStatus.GameExpired){
					this.GroupGame.GroupGameStatus="expired";
					
					// if the host leaves in the middle of game, end game immediately
						this.GameState="game_over";
						this.$q("#groupGameContainer").style.display="none";
						this.NavigateToGroupGamePage(false,details.standings);
					
				}

		}
		});

		document.addEventListener('socketError', ()=>{
		
		this.$q("#groupGameIdText").value="ID NOT VALID";

		setTimeout(()=>{
			this.$q("#groupGameIdText").value="";

		},1500)

			});
	}


    public CurrentPointValue: any={
        MaxPointsForWord:10,
		SecondsForPointChange:15,
		PointsForCurrentWord:0,
		SecondIndex:0
    }

    // this object contains data for group games
	public GroupGame:GroupGame= this.ResetGroupGame();

    // number of high scores to be diplayed on list
	public NumberOfHighScores:number= 10;
	
	// the state the game is in. Values: intro game_play, game_over, high_score
	public GameState= 'intro';

	//Rank of player in highscores
	public CurrentRank:number = 0;

	// number used for countdown timer
	public CountdownNumber:number= 0;
	public LengthOfGameInMinutes= 2;

	//these variables contain the emoji svg
	public $happySvg:string = '';
	public  $closeSvg:string = '';
	public $angrySvg:string = '';

	//object to store end of game datetime
	public EndOfGame:any;

	//this is a list of discarded letters for a round
	public DiscardedLetters:any[]=[];

    public IntroJson:IntroJson={
        Items:  this.introJson.GetIntroJsonItems(
            ()=>{
				const buyCoffeeHTML = this.$q("#buy-coffee-template")!.innerHTML;
                this.ResetRandomNumber(60,40,()=>{this.$q("#terminal")!.innerHTML =  buyCoffeeHTML + !this.ElementIsHidden(this.$q("#rules"))? this.OurRandomWord:'';});

              })
  
    };


   	
		// object containing different steps for countdown to start game
	public CountdownObj={

			Items: [
				{
					'Console': 'Setting up Random Words...', 'Action': () => {

						// if this is a solo game, set up a random workd
						if(!this.GroupGame.IsGroupGame){
							this.SetRandomWord();
						}
						(window as any).InitInput = (window as any).setInterval(() => {
							
							this.DisplayRandomWord();
		
						}, 40);
					}
				},
				{
					'Console': 'Allocating game time...', 'Action': () => {
		
						//var audio = new Audio('audio/playergo.mp3');
						//audio.play();
						let currentNumElem = this.$q("#timer");
						currentNumElem.innerHTML = '00:00';
					}
				},
		
				{
					'Console': 'Finalizing Game...', 'Action': () => {
						(window as any).clearInterval((window as any).InitInput);
						this.$q("#gameText").value = '';
					}
				}
		
		
		
			]
		
		}

	public InviteUsers(){

		const shareData = {
			title: 'Letter Fury Invite',
			text: `Play Letter Fury! Go to this link and watch intructions. Click Join Game when you're ready`,
			url: `https://letterfury.com#gameid=${this.GroupGame.GroupGameName}`
		  }

		  navigator.share(shareData).then(()=>{
			console.log('Item is shared!')
		  })
	}

	public EnterLetterInConsole(letter:string){

		document.querySelector("#inputInner")!.classList.remove("has-cursor");
		const console:HTMLInputElement = this.$q('#gameText');
		let val=console.value;

	 	let contentLength = val.split('').length;

		if (!console.disabled && contentLength<this._wordLength){

			 val=console.value+ letter;
			 console.value = val;
			 contentLength++;

		}
		this.HandleKeyPressEvent(contentLength,val);
		
		
	}

	public RemoveLetter(){
		const console:HTMLInputElement = this.$q('#gameText');
		let valArr = console.value.split('');
		if (valArr.length>0){
		valArr.pop();
		}
		console.value =valArr.join('');

	}

	private ResetGroupGame():GroupGame{
		return{

			IsGroupGame:false,
			GroupGameName:'',
			GroupUserName:'',
			GroupUserStatus:null,
			GroupUserConnected:false,
			GroupGameStatus:"notstarted"
		}
	}
    

	private DisplayRandomWord() {
		const num = Math.floor(Math.random() * (this.ListOfWords.length - 1));
		this.$q("#gameText").value = this.ListOfWords[num];
	}

	// this is the function to start a new game. 
	private InitGame () {

		document.querySelector("#button-modal").classList.remove("modal-window-active");

		if ((window as any).IntroText) {
			(window as any).clearInterval((window as any).IntroText);
		}

		if (this.ElementIsHidden(this.$q("#gameSection"))) {

			this.NavigateToGamePageStart();
		}

		//load all the svg data into variables
		this.$happySvg = this.$q("#happysvg").innerHTML;
		this.$angrySvg = this.$q("#angrysvg").innerHTML;
		this.$closeSvg = this.$q("#closesvg").innerHTML;

		this.WriteToConsole("Resetting Game...","info");

		if(!this.GroupGame.IsGroupGame){
			this.SetRandomWord();
		}

		this.ListOfChances = [];
		this.PlayerScore = 0;
		this.GetTopScore();
		this.BeginAdvancedRound();
		this.FocusInputElement(false);

	}

	public AddPlayerToGame(){
		const savedName = localStorage.getItem("lf_username");
		this.GroupGame.GroupUserStatus="player";
		this.GroupGame.GroupUserName= savedName?savedName.toLocaleLowerCase():this.CreateRandomNames().toLowerCase();
		this.NavigateToGroupGamePage(false);
	}

	public StartGroupGame(isRestart:boolean){

		//if the game is not ready, add a mess
		const isNotReady:boolean =(this.GroupGame.GroupUserStatus==="player" && this.GroupGame.GroupUserConnected)
		if(isNotReady && !isRestart){
			this.WriteToGroupGameConsole("Still waiting for players...<br/>");
			return;
		}
								  
		if(this.GroupGame.GroupUserStatus==="player"){

			this.GroupGame.GroupGameName= this.GroupGame.GroupGameName!==''?
					this.GroupGame.GroupGameName:
					this.$q("#groupGameIdText").value.toLowerCase();
					
			if(this.GroupGame.GroupGameName!==''){
			
				this._dataAccess.InvokeSocketConnection(this.GroupGame.GroupGameName,this.GroupGame.GroupUserName, this.GroupGame.GroupGameStatus);
			}

			setTimeout(()=>{
				this.BuildRandomNameUI("groupUserVal",this.GroupGame.GroupUserName);		  
		},500);
		}
		else{
			this.SetRandomWord();
			this._dataAccess.InvokeSocketGameStart(this.OurRandomWord.toLowerCase(), this.GroupGame.GroupGameName);
		}

	}

	public InitGroupGame(){

		document.querySelector("#button-modal").classList.remove("modal-window-active");

		const savedName = localStorage.getItem("lf_username");
		this.GroupGame.GroupGameName=this.CreateRandomNames().toLowerCase();
		this.GroupGame.GroupUserName=savedName?savedName.toLowerCase():this.CreateRandomNames().toLowerCase();

		this.GroupGame.GroupUserStatus="host";
		this.NavigateToGroupGamePage(false);
		setTimeout(()=>{
		this.BuildRandomNameUI("groupGameVal",this.GroupGame.GroupGameName);
		this.BuildRandomNameUI("groupUserVal",this.GroupGame.GroupUserName);
        
        this._dataAccess.StartGroupGame(this.GroupGame.GroupGameName,this.GroupGame.GroupUserName)
        .then(r=>{

			//set this user as host and upgrade to websocket connection
			this.GroupGame.GroupUserStatus="host";
            this._dataAccess.InvokeSocketConnection(this.GroupGame.GroupGameName,this.GroupGame.GroupUserName,this.GroupGame.GroupUserStatus);


        });
        
		},500);

	}

	private GetTopScore(){

		fetch(`${this.HighScoresEndpoint}/getscores?count=1`)
			.then((result)=>result.json())
			.then((data)=>{

				this.$q("#highScoreCount").innerHTML = data[0].highscore;
			});
	}


	// begins changing page  to the game
	private NavigateToGamePageStart()  {

		this.$q("#ruleSection").style.display = "none";
		this.$q("#groupGameSection").style.display = "none";
		this.$q("#gameSection").style.display = "block";
		this.$q("#consoleContainer").classList.add("easeInRight");
		this.$q("#letterContainer").classList.add("easeInLeft");
		this.$q("#inputContainer").classList.add("easeInLeft");
		this.$q("#title").classList.add("easeUpTitle");
		const keys = this.keyboard.BuildKeyboard();
		this.$q("#lf-keyboard").innerHTML=keys;
		this.keyboard.DisplayLettersOnKeyboard();
	}

	//ends changing the page  to the game (removes animation classes when it completeds )
	private NavigateToGamePageEnd() {

		this.$q("#consoleContainer").classList.remove("easeInRight");
		this.$q("#letterContainer").classList.remove("easeInLeft");
		this.$q("#inputContainer").classList.remove("easeInLeft");

	}

	// changes page to home
	public NavigateToHomePageStart()  {

		this.ResetGroupGame();

		this.$q("#consoleContainer").classList.add("easeOutRight");
		this.$q("#letterContainer").classList.add("easeOutLeft");
		this.$q("#inputContainer").classList.add("easeOutLeft");

	}

	private NavigateToGroupGamePage(isRestart:boolean, standings?:[]){
		
		this.$q("#returnToHomescreen").style.display="none";

		if(this.GroupGame.GroupUserStatus==="player"  && this.GroupGame.GroupGameStatus==="notstarted"){

			this.$q("#groupGameId").classList.add("easeInLeft");

			if(isRestart){
			this.$q("#groupGameInstructions").innerText="Next is about to start. Please get ready!";	
			}
			else{
			this.$q("#groupGameInstructions").innerText="Please enter your game code and press submit to join";	
			}
			this.$q("#groupGameContainer").style.display="none";
			this.$q("#groupGameId").focus();
		}
		else if (this.GroupGame.GroupGameStatus==="expired"){
			
			this.ShowGameExpiredMessage();	

		}
		else
		{
			this.$q("#groupGameId").style.display="none";
			this.$q("#groupGameContainer").classList.add("idSelected");
		}
		this.$q("#gameSection").style.display="none";
		this.$q("#ruleSection").style.display="none";
		this.$q("#groupGameSection").style.display="block";
		this.$q("#groupGameContainer").classList.add("easeInRight");

		if(isRestart){
			const standingsStr =  this.WriteGameStandings(standings);
			this.$q("#groupGameStandings").innerHTML=standingsStr;
		}

		if(this.GroupGame.GroupUserStatus==="player"  ){
			
			this.$q("#inviteGroupGame").style.display="none";
			{
				this.StartGroupGame(isRestart)
			}
		}

	}
	private ShowGameExpiredMessage() {
		this.$q("#groupGameId").classList.remove("easeInLeft");
		this.$q("#groupGameId").classList.add("scatter-console-1");
		this.$q("#groupGameInstructions").innerText =
			"This game has expired as the host has left the game. Return to home screen to begin new game.";
		this.$q("#returnToHomescreen").style.display = "block";
		this.$q("#startGroupGame").style.display="none";
	}

	//removes animation classes from home navigation after completion
	private NavigateToHomePageEnd() {

		
		this.$q("#terminal").classList.remove("extendConsole");
		this.$q("#consoleContainer").classList.remove("easeOutRight");
		this.$q("#letterContainer").classList.remove("easeOutLeft");
		this.$q("#inputContainer").classList.remove("easeOutLeft");
		this.$q("#title").classList.remove("easeUpTitle");
		this.$q("#gameSection").style.display = "none";
		this.$q("#ruleSection").style.display = "block";
		this.ShowIntro();

	}

	// shows the intro.rules via a timer
	public ShowIntro()  {

		
		const $body = this.$q("body");

			//hide the startgame button, if person has a game code
		if(this.GroupGame.GroupGameName!==''){
		const createGameBtn:HTMLElement = this.$q('#createGameBtn');
		createGameBtn.style.display="none";
		}

		document.querySelector("#terminal")!.classList.remove("flattenConsole");

		this.RenderConsoleText(this.IntroJson.Items[0]);

		(window as any).IntroText = (window as any).setInterval(() => {

			console.log(`index starts at ${this.IntroIndex}`);
			const currentItem = this.IntroJson.Items[this.IntroIndex];
			
			this.RenderConsoleText(currentItem);


			this.IntroIndex = this.IntroIndex >= this.IntroJson.Items.length - 1 ? 0 : this.IntroIndex + 1;
			console.log(`index is at ${this.IntroIndex}`);

		}, 4000)
	
	}

	public ChangeIntroItem(moveForward:boolean){

		if(moveForward){

			console.log(`index advances at ${this.IntroIndex}`);
			const currentItem = this.IntroJson.Items[this.IntroIndex];	
			this.RenderConsoleText(currentItem);
			this.IntroIndex = this.IntroIndex >= this.IntroJson.Items.length - 1 ? 0 : this.IntroIndex + 1;

		}
		else{

	       const newIntroIndex = this.IntroIndex-2;	
		   this.IntroIndex = newIntroIndex<0? 0: newIntroIndex;
		   const currentItem = this.IntroJson.Items[this.IntroIndex];	
			this.RenderConsoleText(currentItem);
			console.log(`index goes back at ${this.IntroIndex}`);

		}

	}
	

	private ResetRandomNumber(delay:number, repetitions:number,elementReset:Function) {
		var x = 0;
        
		var intervalID = (window as any).setInterval( ()=> {
			

			if(!this.GroupGame.IsGroupGame){
				this.SetRandomWord();
			}
			elementReset();
	
		   if (++x === repetitions) {
			   (window as any).clearInterval(intervalID);
			   this.ClearGameText();
		   }
		}, delay);
	}

	// this writes to the console on the rules page by splitting the value and writing it char by char 
	private RenderConsoleText(obj:any) {

		const $rulesElem = this.$q("#rules");
		const $currentElem = this.$q("#terminal");
		$rulesElem.innerHTML = obj.Text;

		const buyCoffeeHTML = this.$q("#buy-coffee-template").innerHTML;

		if(typeof(obj.Console)==='string'){

		obj.Console.split('').forEach((item:string, index:number, arr:any[]) => {

			((index:number)=> {
				(window as any).setTimeout(() => {

					if (index === arr.length - 1 && obj.HTML !== '' && !this.ElementIsHidden($rulesElem)) {
						$currentElem.innerHTML = buyCoffeeHTML + obj.HTML;

					}
					else if(!this.ElementIsHidden($rulesElem)) {
						const currentText = obj.Console.substring(0, index + 1);
						$currentElem.innerHTML = buyCoffeeHTML + currentText;
					}


				}, 100 * index);
			})(index);
		});
	}
	else{
		obj.Console();
	}


	}


	private SkipWord(){

		this.WriteToConsole( `The word was ${this.OurRandomWord.toLowerCase() }.Skipping..`);
		this.NumberOfSkips--;
		this.WriteToConsole( `You have ${this.NumberOfSkips} skip(s) left`);
		if(this.NumberOfSkips===0){
			this.$q("#skipWordLink").style.display="none";
		}
		this.StartNextRound(true);

	}

	//runs after the a player has guessed the correct #, and lets them choose another
	private StartNextRound(isSkip:boolean) {
		this.DiscardedLetters=[];
		this.keyboard.RemoveAllKeyClasses();

		if(!this.GroupGame.IsGroupGame){
			this.SetRandomWord();
		}
		this.ListOfChances = [];	
		this.WriteToConsole( `Points for word set to  ${this.CurrentPointValue.MaxPointsForWord}`);
		this.CurrentPointValue.PointsForCurrentWord=this.CurrentPointValue.MaxPointsForWord;
		this.$q("#playerScoreCount").innerHTML=this.PlayerScore.toString();
		this.$q("#letterText").innerHTML='';

	}

	private  InvokeGroupPointAwarded(result:GroupGameResult){

		if(!result.player)
			return;

		let index=0;
		const consoleCont:HTMLElement = document.querySelector("#consoleContainer");
		const consoleText:HTMLElement = document.querySelector("#consoleText");

		const guessedWord = result.player===this.GroupGame.GroupUserName?this.OurPreviousRandomWord:this.OurRandomWord;
		consoleText.innerHTML=`<span class="point-text">${result.player} guessed ${guessedWord }</span>`;

		(window as any).PointView = setInterval(()=>{

			this.DisplayRandomWord();

			if(index%6==0){
			if(consoleCont.classList.contains("console-point-highlight")){

				consoleCont.classList.remove("console-point-highlight");

			}
			else
			{
				consoleCont.classList.add("console-point-highlight");
			}
		}
			index++;
			if (index===50){
				clearInterval((window as any).PointView);
				consoleText.innerHTML='';
				consoleCont.classList.remove("console-point-highlight");this.$q("#gameText").value = '';
				this.keyboard.RemoveAllKeyClasses();
				this.OurRandomWord = result.word;
				this.StartNextRound(false);
				
			};
		},40);



		

	}

	// animation that runs when the game ends
	private InvokeConsoleScatter(){

		this.$q("#consoleText").insertBefore(this.GameOverText(),this.$q("#consoleText").firstChild);

		(window as any).setTimeout(()=>{
		document.querySelectorAll(".console-comment").forEach($elem=>{

			const scatter = (Math.floor(Math.random() * 3) + 1).toString();  
			const scatterClass=`scatter-console-${scatter}`;
			if($elem.id!==undefined){
			console.log($elem.id);
			$elem.classList.add(scatterClass);
			}
		});

	},500);

	}

	private SetRandomWord()  {

	   //store the previous random word
	   this.OurPreviousRandomWord=  this.OurRandomWord;
	   const num= Math.floor(Math.random() *  (this.ListOfWords.length-1));
	   this.OurRandomWord  = this.ListOfWords[num];

	   console.log(`word is ${this.OurRandomWord}`);

	}

	// this writes to the main console, and high score console. it takes the text, writes char by char, and applies 
	//the class passed in (elemClass) to apply the correct colour
	// if timeout time is 0, write entire string immediately
	private WriteToConsole (text:string, elemClass?:string, target?:string, timeoutTime?:number) {
		if (target === undefined) {
			target = "#consoleText";
		}
		if (timeoutTime === undefined) {
			timeoutTime=10;
		}

		let id = `comment--${Math.floor(Math.random() * 10000000)}`;
		let textElem = document.createElement("div");
		textElem.id = id;
		//textElem.innerHTML = text;
		textElem.className = elemClass??'';
		textElem.classList.add("console-comment");
		const parentElem = this.$q(target);

		this.$q(target).insertBefore(textElem, parentElem.firstChild);

		var $currentElem = this.$q("#" + id);

		if(timeoutTime==0){

			$currentElem.innerHTML=text;
			return;
		}

		text.split('').forEach((item, index) => {

			(function (index) {
				(window as any).setTimeout(() => {

					const currentText = text.substring(0, index + 1);
					$currentElem.innerHTML = currentText;


				}, timeoutTime! * index);
			})(index);

		});


	}

	// counts down to the beginning of the game
	private BeginAdvancedRound() {		
		this.CountdownNumber = 0;
		this.$q("#gameText").setAttribute("disabled", true);

		// reset game score if this is not the first game
		this.PlayerScore=0;
		this.NumberOfSkips = this.SkipsAllowed;
		this.$q("#playerScoreCount").innerHTML=this.PlayerScore.toString();
		(window as any).Countdown = setInterval(() => {


			if (this.CountdownNumber < 3) {
				const currentCountObj = this.CountdownObj.Items[this.CountdownNumber];
				this.WriteToConsole(currentCountObj.Console, "");
				currentCountObj.Action();
				this.CountdownNumber++;

			}
			else {
				//this.CountdownNumber = 5;gg
				clearInterval((window as any).Countdown);
				this.$q("#timer").innerHTML = "GO!";
				this.CurrentPointValue.PointsForCurrentWord = this.CurrentPointValue.MaxPointsForWord;
				this.WriteToConsole(`Points allocated for current word: ${this.CurrentPointValue.PointsForCurrentWord}`);
				this.BeginAdvancedGame();

			}

		}, 1000)

	}

	// sets up the timer that runs the game
	private BeginAdvancedGame() {
		this.GameState = 'game_play';

		this.$q("#gameText").removeAttribute("disabled");

		this.EndOfGame = new Date().getTime() + this.LengthOfGameInMinutes * 60000;
		this.FocusInputElement(false);
		this.$q("#inputInner").className = "has-cursor";

		(window as any).GamePlay = setInterval(() => {

			const now = new Date().getTime();
			const t = this.EndOfGame - now;
			if (t <= 0) {
				this.AddLoadingIcon(this.$q("#inputContainer"),"lds-facebook");
				this.$q("#inputContainerInner").style.display="none";

				(window as any).clearInterval((window as any).GamePlay);
				this.InvokeConsoleScatter();

				(window as any).setTimeout(()=>{
				
				this.$q("#consoleText").innerHTML='';

				// only solo games can log high scores
				// if this is a group game check for the winner
				if(!this.GroupGame.IsGroupGame){
					this.CheckForHighScore(0);
				}
				if(this.GroupGame.IsGroupGame && this.GroupGame.GroupUserStatus==='host'){

					this._dataAccess.InvokeSocketGameEnd(this.GroupGame.GroupGameName);
				}
			

				},2000);
			}
			else {

				// set point count for player
				// if th
				const decreasePointValue=this.CurrentPointValue.SecondIndex===this.CurrentPointValue.SecondsForPointChange;
				if(decreasePointValue &&  this.CurrentPointValue.PointsForCurrentWord>1){
					this.CurrentPointValue.PointsForCurrentWord --;
					this.CurrentPointValue.SecondIndex=0;
					this.WriteToConsole( `Points for current word: ${this.CurrentPointValue.PointsForCurrentWord}`,"bonus");
				}
				if(!decreasePointValue){
					this.CurrentPointValue.SecondIndex++;
				}

				this.SetCountdownClock(t);
			}

		}, 1000);

	}


	private ClearGameText()  {
		this.$q("#gameText").value = "";
	}


	private InitGameOver() {

		this.GameState = 'game_over';

		this.$q("#consoleText").innerHTML = "";
		this.$q("#inputInner").classList.add("has-cursor");
		this.FocusInputElement(false);
		this.ClearGameText()
		this.ClearSvgValues();

		if(!this.GroupGame.IsGroupGame){
		this.$q("#letterText").innerHTML='';
		this.WriteToConsole(`The final word was ${this.OurRandomWord}`);
		this.WriteToConsole(`If you would like to play again, type YES into the input box.
								 To go back to the homepage and high, scores, type NO `, "info");
		}
		 this.ClearGameText();
	}

	// adds seconds if a player has gotten a bonus
	private AddSecondsToTime (timeAddedInSeconds:number) {

		for (let i = 0; i <= timeAddedInSeconds; i++) {

			((i)=> {
				(window as any).setTimeout(() => {
					this.EndOfGame += 1000;
					const t = this.EndOfGame - new Date().getTime();;
					this.SetCountdownClock(t);

				}, 10 * i);

			})(i);

		}

	}

	private SetCountdownClock(t:number) {
		let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
		let seconds = (Math.floor((t % (1000 * 60)) / 1000)).toString();

		seconds = parseInt(seconds) < 10 ? '0' + seconds : seconds;


		this.$q("#timer").innerHTML = `${minutes}:${seconds}`;

	}


	// loops through the high scores and checks if this score falls in top 10
	private HasHighScore(score: number, highscores:any): boolean{

		
		let hasHighScore = false;

		for(let i =0; i< highscores.length;i++){

			if(score > highscores[i].highscore){

				this.CurrentRank = (i+1);
				hasHighScore=true;
				break;
			}
		}


		if(hasHighScore === false && highscores.length<10 && score>0){
			console.log(highscores.length);
			this.CurrentRank = (highscores.length+1);
			hasHighScore =  true;
		}

		return hasHighScore;

	}

	// gets current scores from db. if the player is in the highscore list, 
	//allow player to add initials. Otherwise continue to game over
	private CheckForHighScore(score: number) {

		fetch(`${this.HighScoresEndpoint}/getscores`)
			.then((result)=>result.json())
			.then((data)=>{
				this.RemoveLoadingIcon( this.$q("#inputContainer"),"lds-facebook");
				this.$q("#inputContainerInner").style.display="block";
				const hasHighScore = this.HasHighScore(this.PlayerScore,data);
				if (!hasHighScore) {
					this.InitGameOver();
				}
				else {
					this.GameState = 'high_score';
					document.querySelector("#inputInner")!.classList.add("has-cursor");
					this.FocusInputElement(false);
					//this.$q("#inputAction").innerHTML = "initials";
					this.$q("#consoleText").innerHTML='';
					this.WriteToConsole(`Congratulations! you are ranked number ${this.CurrentRank} on our list of all time champs!
													Please enter your initials`, "bonus");
				}			


			});

		const higherScores = this.HighScores.filter(e => e >= score);
		return higherScores.length;
	}

	// puts focus on input element for each turn. disabled on mobile because the keyboard pops up and hides console
	private FocusInputElement(allowMobileFocus: boolean){
		if((window as any).matchMedia('(min-width: 961px)').matches){

			this.$q("#gameText").focus();
		}
	}

	//sends high score to db
	private SetScores (initials: string) {
		this.AddLoadingIcon(this.$q("#inputContainer"),"lds-facebook");
		this.$q("#inputContainerInner").style.display="none";
		fetch(`${this.HighScoresEndpoint}/logscores`, {
			mode:'no-cors',
  			method: 'post',
 			 headers: {
   			 'Accept': 'application/json, text/plain, */*',
   			 'Content-Type': 'application/json'
  			},
  			body: JSON.stringify({name: initials, highscore: this.PlayerScore})
			}).then((res)=>{
				this.RemoveLoadingIcon( this.$q("#inputContainer"),"lds-facebook");
				this.$q("#inputContainerInner").style.display="block";
				if(res.ok){
					this.WriteToConsole(`High score successfully added for ${initials}`,"info");
				}
				else{
					this.WriteToConsole("Sorry, could not add high score","error");
				}

				this.InitGameOver();

			});
  			
	}

	private DisplayInputResults ($gameTextElem:any, text:string, className:string) {

		const emojis = document.querySelectorAll(".game-emoji");
		
		for(const emoji of emojis){
			emoji.classList.add("flatten-emoji");
		}		
		(window as any).setTimeout(() => {
			this.ClearTextConsole($gameTextElem, text, className);
			$gameTextElem.classList.remove('error');
		}, 1000);


	}

	private ClearTextConsole($gameTextElem: any, text: string, className: string) {
		$gameTextElem.value = "";

		this.$q("#gameText").style.visibility = "visible";
		//this.$q("#mainBody label").style.display="block";
		this.$q("#inputInner").className = "has-cursor";

		this.WriteToConsole(text, className);
		this.$q("#gameText").focus();
	}

	// gets the high scores from the db and displays them on the highscore console
	private DisplayScores() {
		if ((window as any).IntroText) {
			(window as any).clearInterval((window as any).IntroText);
		}

		const $terminal = this.$q("#terminal");
		let advancedText = '';
		$terminal.innerHTML = '';
		this.AddLoadingIcon($terminal,"lds-facebook");
		
		fetch(`${this.HighScoresEndpoint}/getscores`)
			.then((result)=>result.json())
			.then((data)=>{

				this.RemoveLoadingIcon($terminal,"lds-facebook");
				this.HighScores = data;
		if(this.HighScores.length===0){

			this.WriteToConsole('<h3>No High Scores</h3>', "high-score-item", "#terminal");
			return;
		}

		for (let i = this.HighScores.length - 1; i >= 0; i--) {

			if (i === 0) {
				advancedText = '<h3>High Scores</h3>';
			}

			advancedText += `${this.HighScores[i].name} - ${this.HighScores[i].highscore}<br/>`;
			console.log(advancedText);
			this.WriteToConsole(advancedText, "high-score-item", "#terminal");
			advancedText = '';

		}
	});


	}

	private ElementIsHidden($el:HTMLElement) {
		return $el.offsetParent === null;

	}

	private AddLoadingIcon($parent:HTMLElement, icon:string)
	{
		let $loading = document.createElement("div");
		//textElem.innerHTML = text;
		$loading.className = icon;
		if(icon ==="lds-facebook"){
			for(let i=0;i<3;i++)
			{
				let $innerElem = document.createElement("div");
				$loading.appendChild($innerElem);
			}
		}
		$parent.appendChild($loading);

	}

	private RemoveLoadingIcon($parent:HTMLElement,icon:string)
	{	
		const $elem = this.$q(`.${icon}`);
		if($elem!==null){
			$parent.removeChild($elem);
		}
	}


	// this the primary function for guessing an item. it gets the input value
	// checks if input correct, and then processes result
	private MakeSelection() {

	
		let $gameTextElem:HTMLElement = this.$q("#gameText");

		const regex = /^[a-zA-Z]{3}$/;
		let gameText = ($gameTextElem as any).value;
		if (!regex.test(gameText)  || !this.AcceptableWords.includes(gameText)) {
			$gameTextElem.classList.add('error');
			window.setTimeout(()=>
			{
				this.DisplayInputResults($gameTextElem, "Invalid word", "error");
			
			}
			
			,500 );


		}
		else {

		
			//take the number computer made and split that into 3 pieces
			//then compare the computer number against our number

			let whatIsHappening = 'The computer has word' + this.OurRandomWord + ' and we have chosen ' + gameText;

			let ourGameText = gameText.split('');

			let resultsCode = '';

			let computerGameText = this.OurRandomWord.split('');

			($gameTextElem as any).value = '';

			if (this.OurRandomWord.toString().toLowerCase() === gameText.toLowerCase()) {
				
				this.PlayerScore+=this.CurrentPointValue.PointsForCurrentWord;
				this.DisplayInputResults($gameTextElem, "Congrats! Code successfully unlocked. Resetting to new number", "victory");
				this.ResetRandomNumber(40,12,()=>{this.DisplayRandomWord();});


				if (this.ListOfChances.length < 4 && !this.GroupGame.IsGroupGame) {

					this.DisplayInputResults($gameTextElem, "30 second bonus for guessing in under 4 tries", "bonus");
					this.AddSecondsToTime(30);
				}
				else if (this.ListOfChances.length > 3 && this.ListOfChances.length < 7  &&!this.GroupGame.IsGroupGame) {

					this.DisplayInputResults($gameTextElem, "15 second bonus for guessing in under 7 tries", "bonus");
					this.AddSecondsToTime(15);

				}
				this.ClearSvgValues();
				if(!this.GroupGame.IsGroupGame){
					this.StartNextRound(false);
				}
				else{
					this.SetRandomWord();
					this._dataAccess.InvokeSocketWordGuessed(gameText,this.OurRandomWord, this.GroupGame.GroupUserName, this.GroupGame.GroupGameName,this.PlayerScore);
				}
				return;

			}

			for (let i = 0; i < 3; i++) {
				//check our number against the computers number
				if (ourGameText[i].toLowerCase() === computerGameText[i].toLowerCase() ) {
					whatIsHappening += `<br/>Number ${i + 1} was right!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += '&#128522;';
					this.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(),'right');
					this.$q("#resultImg-"+i).innerHTML=this.$happySvg;
					this.keyboard.AddKeyClass(ourGameText[i].toLowerCase(),'correct');

				}
				else if ((ourGameText[i].toLowerCase() !== computerGameText[i].toLowerCase()) && this.OurRandomWord.toLowerCase().indexOf(ourGameText[i].toLowerCase()) !== -1) {
					whatIsHappening += `<br/>Number ${i + 1} not totally right - it is there, but not in the same place!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += '&#128579;';
					this.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(),'almost');
					this.$q("#resultImg-"+i).innerHTML=this.$closeSvg;
					this.keyboard.AddKeyClass(ourGameText[i].toLowerCase(),'close');

				}
				else {
					whatIsHappening += `<br/>Number ${i + 1} was wrong!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += '&#128577;';
					this.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(),'wrong');
					this.$q("#resultImg-"+i).innerHTML=this.$angrySvg;
					this.keyboard.AddKeyClass(ourGameText[i].toLowerCase(),'incorrect');

				}

			}

			resultsCode = `${resultsCode} (${gameText})`;

			this.ListOfChances.push(resultsCode);

			this.WriteDiscardedLettersToScreen();


			//$gameTextElem.value = resultsCode.split(' ')[0];
		
			if(this._testMode){
			console.log(whatIsHappening);
			}

			//show the emoji results
			//this.$q("#mainBody label").style.display="none";
			this.$q("#resultsDisplay").style.display="flex";
			this.$q("#gameText").style.visibility="hidden";

			this.DisplayInputResults($gameTextElem, `Code ${resultsCode} for letter ${gameText} (attempt ${this.ListOfChances.length})`, "results");

			//give incentive to get bonus points
			if (this.ListOfChances.length === 2) {
				this.WriteToConsole("One more chance for 30 second bonus", "bonus");
			}

			//give incentive to get bonus points
			if (this.ListOfChances.length === 5) {
				this.WriteToConsole("One more chance for 15 second bonus", "bonus");
			}

		}

	}
	

	private WriteDiscardedLettersToScreen(){

		const spanOpen = (exp:string)=>`<span class="${exp} discarded-letter">`;
		const spanClose="</span>"
		const joinVal = this.DiscardedLetters.reduce((t,c)=>  t + `${spanOpen(c.val)}${c.letter}${spanClose}` ,'');
		this.$q("#letterText").innerHTML=joinVal;
	}

	private WritePlayersToGroupScreen(payload:GroupGameResult){

		if(payload.status==="expired"){	
			
				this.ShowGameExpiredMessage();
				return;	
		}	
		if(this.GroupGame.GroupUserStatus==="player"  && !this.GroupGame.GroupUserConnected &&this.GroupGame.GroupUserName=== payload.player){
			this.$q("#groupGameId").classList.remove("easeInLeft");
			this.$q("#groupGameId").classList.add("scatter-console-1");
			this.$q("#groupGameContainer").style.display="block";
			this.$q("#startGroupGame").style.display="none";
			this.$q("#groupGameContainer").classList.add("drop-frame");
			if(payload.status===GroupGameStatus.GameInProgress){
				this.$q("#groupGameInstructions").innerText="Game currently in progress! Please wait until next game...";	
			}
			else{
			this.$q("#groupGameInstructions").innerText="The game will start shortly! Please wait for players to join...";	
			}
			this.BuildRandomNameUI("groupGameVal",this.GroupGame.GroupGameName);
			this.BuildRandomNameUI("groupUserVal",this.GroupGame.GroupUserName); 
			}

		this.GroupGame.GroupUserConnected=true;

		if(this.GroupGame.GroupUserName!==payload.player){		
			const message = `${payload.player} has joined<br/>`;
			this.WriteToGroupGameConsole(message);			
		}

	}

	private WriteToGroupGameConsole(message:string){
		let currentText=this.$q("#groupPlayersVal").innerHTML;
		currentText = message + currentText;
		this.$q("#groupPlayersVal").innerHTML=currentText;
	}


	//the hs buttom alternatives between rules and high scores, change back and forth between keypress
	private ToggleHighScoreButton(){
		let $rulesElem:HTMLElement = this.$q("#rules");
		let $terminalElem:HTMLElement = this.$q("#terminal");
		let $button:HTMLElement = this.$q("#highScoreButton");

		if (this.ElementIsHidden($rulesElem)) {
			$rulesElem.style.display = "block";
			$terminalElem.classList.remove("extendConsole");
			$terminalElem.classList.add("flattenConsole");
			$button.innerHTML = "High Scores";
			this.ShowIntro();

		}
		else {
			$rulesElem.style.display = "none";
			$terminalElem.classList.add("extendConsole");
			$button.innerHTML = "See Rules";

		}
	}

	private HandleKeyPressEvent(eventLength:number,eventValue:string){

		if (eventLength >= this._wordLength && this.GameState === 'game_play') {
			this.MakeSelection();
		}
		else if (eventValue.toUpperCase() === 'YES' && this.GameState === 'game_over') {
			this.InitGame();
		}
		else if (eventValue.toUpperCase() === 'NO' && this.GameState === 'game_over') {
			this.NavigateToHomePageStart();
		}
		else if (eventLength== this._wordLength && this.GameState === 'high_score') {
			this.SetScores(eventValue);
		}
	}
	// checks which css animation has completed and routes to correct fn
	private HandleAnimationEnding(e:any){
		switch (e.animationName) {

			case 'extend-console':
				this.DisplayScores();
				break;
			case 'ease-left':
				this.NavigateToGamePageEnd();
				break;
			case 'scatter-console-1':

			this.$q("#groupGameId").style.display="none";

				break;
			case 'ease-out-left':
				this.NavigateToHomePageEnd();
				break;
			case 'flatten-console':
				this.ShowIntro();
				break;
			case 'ease-up':
				this.$q("#legend").classList.remove("easeUpLegend");
				break;
			case 'flatten-emoji':
				const emojis = document.querySelectorAll(".game-emoji");
				for(const emoji of emojis){
					emoji.classList.add("flatten-emoji");
				}	
				this.$q("#resultsDisplay").style.height="10px";
				break;
		}
	}

	private GroupGameEnd(results:any[], standings:[]){

		const $console = this.$q("#consoleText");

		// sort all the users by points
		let items = results.sort((a,b)=>b.points-a.points).slice(0,3);

		this.FinalScoreQueue.push({player:'gameover','rank':0,'score':0});

		$console.innerHTML='';
		//iterate from last place to second
		for(let i=0; i<items.length;i++){
			const item = items[i];
			const scoreItem:ScoreItem={
				player:item.player,
				rank: (i+1),
				score:item.points


			}

		this.FinalScoreQueue.push(scoreItem);

		

		}

		this.ShowPlayerScore();

		(window as any).endInterval = setInterval(()=>{
		this.ShowPlayerScore();
					if(this.FinalScoreQueue.length===0){
						this.FinalScoreIndex=1;
						clearInterval((window as any).endInterval);
						this.GroupGame.GroupGameStatus="completed";
						this. InitGameOver();
						this.NavigateToGroupGamePage(true, standings);

					}
				},2000);
	}



	private ShowPlayerScore() {
		const intervalNum = this.FinalScoreIndex%2;
		if(intervalNum!==0){
		this.ClearGameText()
		const item = this.FinalScoreQueue.pop();
		const places:string[] = ['','first','second','third'];
		const resultText = `${item.player} is ${places[item.rank]} with a score of ${item.score}`;
		this.WriteToConsole(resultText,"winner",undefined,0);
		}
		else{
			document.querySelectorAll(".console-comment").forEach($elem=>{
				if($elem.id!==undefined){
				console.log($elem.id);
				const scatterVal=  this.FinalScoreQueue.length ===1?'winner': intervalNum.toString();

				$elem.classList.add(`scatter-console-${scatterVal}`);
				}
			});
	
		}
		this.FinalScoreIndex++;
	}

	private GameOverText(){

		let $elem = document.createElement("div");
		let $innerElem = document.createElement("pre");
		$elem.appendChild($innerElem);
		$elem.className="gameOver";
		if((window as any).matchMedia('(min-width: 961px)').matches){

		$innerElem.innerHTML=`	
		dP""b8     db    8b    d8 888888     
		dP   '"   dPYb   88b  d88 88__ 
		Yb  "88  dP__Yb  88YbdP88 88""  
		 YboodP dP""""Yb 88 YY 88 888888    
		 dP"Yb  Yb    dP 888888 88""Yb      
		dP   Yb  Yb  dP  88__   88__dP       
		Yb   dP   YbdP   88""   88"Yb        
		 YbodP     YP    888888 88  Yb  					
		`;
		}
		else{
			$innerElem.innerHTML ="GAME OVER";
		}
		return $elem;
	}

	PushToDiscardedLetterArray(letter:string, val:any){
		 this.DiscardedLetters= this.DiscardedLetters.filter(e=>e.letter!==letter);
		 this.DiscardedLetters.push({letter,val});

	}
	
	private CreateRandomNames(){
		const wordCount = this.ListOfWords.length-1;
		const wordArr=[];
		for(let i=0;i<3;i++){
			const rand = Math.floor(Math.random() * wordCount);
			wordArr.push(this.ListOfWords[rand]);
		}
		return wordArr.join('');
	}

	BuildRandomNameUI(id:string,val: string){
        const that = this;
		let alphabet='abcdefghijklmnopqrstuvwxyz@.1234567890-_!#$%&*+-/=?^_`{|}~'.split('');
		let valArr = val.split('');
		let itemFound:any[]=[];
		for(let i=0;i<valArr.length;i++){
			itemFound.push('');
		}
		let counter=0;

		that.wordIntervalArr[val]=setInterval(function(counter) {
			return ()=> {
				
				
				const currentLetter = alphabet[counter];

				if(currentLetter===undefined){
					that.clearAllIntervals();
				}
				if(counter === alphabet.length){
				
					clearInterval(that.wordIntervalArr[val]);
				}

				console.log('Current Letter is '+ currentLetter );
				const currentWordArr=[];

				for (let i=0;i<valArr.length;i++){
					if(itemFound[i]!==''){
						currentWordArr.push(itemFound[i]);
					}
					else{
						currentWordArr.push(currentLetter)
						if(currentLetter ===valArr[i]){

							itemFound[i]=currentLetter;
						}

					}
					
				}

				const currentWord = currentWordArr.join('');

				console.log('Current Word is '+ currentWord );
				const $currentElem:HTMLElement = that.$q("#" + id);
				$currentElem.innerHTML = currentWord;
				
				++counter;
			};
		}(0), 50);

	}

	private WriteGameStandings(standings:[]):string{

		const overallStandings:Standings[]=[];
		
		standings.forEach((item:string)=>{
			const players = overallStandings.map(e=>e.player);

			const standings:Standings[]=JSON.parse(item);
			standings.forEach(standing=>{
				if(!players.includes(standing.player))
				{
					overallStandings.push(standing);
				}
				else{
					const playerStanding = overallStandings.find(e=>e.player===standing.player);
					playerStanding.points+=standing.points;
				}
			});
		});

		overallStandings.sort((a,b)=>b.points-a.points);
		
		const border:string = Array(8).fill('-').join('');
		const standingsStr= overallStandings.map(e=> `${e.player} has ${e.points} points`).join('<br/>');
		return `${border}<br/>${standingsStr}<br/>${border}`;
	}

	ClearSvgValues(){

		for(let i=0;i<3;i ++){
		this.$q("#resultImg-"+i).innerHTML='';
		}
	}

	private clearAllIntervals(){
		// Get a reference to the last interval + 1
		const interval_id = window.setInterval(function(){}, Number.MAX_SAFE_INTEGER);

// Clear any timeout/interval up to that id
		for (let i = 1; i < interval_id; i++) {
 			 window.clearInterval(i);
		}
	}

	private IsDesktop(){
		const ua = navigator.userAgent
		if (/android/i.test(ua)) {
		  return false;
		}
		else if ((/iPad|iPhone|iPod/.test(ua))){
		  return false;
		}
		return true;
	  }



}