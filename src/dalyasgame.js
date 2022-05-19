//abbreviates the native DOM selector for easier use
const $q = document.querySelector.bind(document);

window.NameUI=[];

 DalyasGame = {

	

	//
	ListOfWords : DalyasGameWordList(),

	

	// holds high scores retrived from endoint
	HighScores: [],
	
	// endoint for  retrieving high scores. TODO add to config file
	HighScoresEndpoint:'https://6dmnrf7ylc.execute-api.us-east-1.amazonaws.com/default',
	
	//Random Word generated for game
	OurRandomWord: '',// 
	
	//container for each chance per random number
	ListOfChances: [],

	// if set to true, outputs comments about game logic to console
	TestMode:false,
	
	//Number of times a player guesses during a turn. TODO: make this private
	NumberOfRounds: 0,

	// Counter for the intro (rules)
	IntroIndex: 1,

	// number of times a word can be skipped
	SkipsAllowed:3,
	NumberOfSkips:0,

	// Words always start at  MaxPointsForWord and decrease by SecondsForPointChange
	CurrentPointValue:{
		MaxPointsForWord:10,
		SecondsForPointChange:15,
		PointsForCurrentWord:0,
		SecondIndex:0

	},

	// this object contains data for group games
	GroupGame:{

		IsGroupGame:false,
		GroupGameName:'',
		GroupUserName:''
	},

	// number of high scores to be diplayed on list
	NumberOfHighScores: 10,
	
	// the state the game is in. Values: intro game_play, game_over, high_score
	GameState: 'intro',

	//Rank of player in highscores
	CurrentRank:0,

	// number used for countdown timer
	CountdownNumber: 0,
	LengthOfGameInMinutes: 3,

	//these variables contain the emoji svg
	$happySvg:'',
	$closeSvg:'',
	$angrySvg:'',

	//object to store end of game datetime
	EndOfGame: {},

	//this is a list of discarded letters for a round
	DiscardedLetters:[],
	
	//these are the different steps for the rules, and run in a loop
 	IntroJson :{
		Items: [
			{ 'Console': ()=>{ DalyasGame.ResetRandomNumber(60,40,()=>{$q("#terminal").innerHTML = !DalyasGame.ElementIsHidden($q("#rules"))? DalyasGame.OurRandomWord:'';}); }, 'Text': 'The computer has chosen a 3-letter word.', 'HTML': '' },
			{ 'Console': '???', 'Text': 'You need to guess what it is.', 'HTML': '' },
			{ 'Console': '  ', 'Text': 'The computer will give you am emoji with some clues. ', 'HTML': '<img src="img/happy.svg"  height="120"/><img src="img/angry.svg"  height="120"/><img src="img/close.svg"  height="120"/>' },
			{ 'Console': '  ', 'Text': 'The emoji &#128577; means the letter is NOT in the word.', 'HTML': '<img src="img/angry.svg"  height="120"/>' },
			{ 'Console': '  ', 'Text': 'The emoji &#128579;  means the letter is in the word, but in the wrong place.', 'HTML': '<img src="img/close.svg"  height="120"/>' },
			{ 'Console': '  ', 'Text': '&#128522;  Means the letter is in the right place.', 'HTML': '<img src="img/happy.svg"  height="120"/>' },
			{ 'Console': '  ', 'Text': 'Your goal is to get &#128522; &#128522; &#128522; as many times as you can in 2 minutes.', 'HTML': '<img src="img/happy.svg"  height="120"/><img src="img/happy.svg"  height="120"/><img src="img/happy.svg"  height="120"/>' },
			{ 'Console': '  ', 'Text': 'Are you ready to accept the challenge?', 'HTML': '<span onclick="DalyasGame.Init();" id="clickToStart">Click to start</button>' }

			]

		},
		
		// object containing different steps for countdown to start game
		CountdownObj:{

			Items: [
				{
					'Console': 'Setting up Random Words...', 'Action': () => {
		
		
						window.InitInput = window.setInterval((event) => {
		
							DalyasGame.SetRandomWord();
							$q("#gameText").value = DalyasGame.OurRandomWord;
		
						}, 40);
					}
				},
				{
					'Console': 'Allocating game time...', 'Action': () => {
		
						//var audio = new Audio('audio/playergo.mp3');
						//audio.play();
						let currentNumElem = $q("#timer");
						currentNumElem.innerHTML = '00:00';
					}
				},
		
				{
					'Console': 'Finalizing Game...', 'Action': () => {
						window.clearInterval(window.InitInput);
						$q("#gameText").value = '';
					}
				}
		
		
		
			]
		
		},

	// this is the function to start a new game.  Should probably be changed to GameInit
	Init: function () {

		if (window.IntroText) {
			window.clearInterval(window.IntroText);
		}

		if (DalyasGame.ElementIsHidden($q("#gameSection"))) {

			DalyasGame.NavigateToGamePageStart();
		}

		//load all the svg data into variables
		$happySvg = $q("#happysvg").innerHTML;
		$angrySvg = $q("#angrysvg").innerHTML;
		$closeSvg = $q("#closesvg").innerHTML;




		DalyasGame.WriteToConsole("Resetting Game...","info");
		DalyasGame.SetRandomWord();
		DalyasGame.ListOfChances = [];
		DalyasGame.NumberOfRounds = 0;
		DalyasGame.GetTopScore();
		DalyasGame.BeginAdvancedRound();
		DalyasGame.FocusInputElement(true);

	},

	InitGroupGame:function(){

		DalyasGame.GroupGame.GroupGameName=DalyasGame.CreateRandomNames().toLowerCase();
		DalyasGame.GroupGame.GroupUserName=DalyasGame.CreateRandomNames().toLowerCase();
		DalyasGame.NavigateToGroupGamePage();
		setTimeout(function(){
		DalyasGame.BuildRandomNameUI("groupGameVal",DalyasGame.GroupGame.GroupGameName);
		DalyasGame.BuildRandomNameUI("groupUserVal",DalyasGame.GroupGame.GroupUserName);
		},500);

	},

	GetTopScore:function(){

		fetch(`${DalyasGame.HighScoresEndpoint}/getscores?count=1`)
			.then((result)=>result.json())
			.then((data)=>{

				$q("#highScoreCount").innerHTML = data[0].highscore;
			});
	},


	// begins changing page  to the game
	NavigateToGamePageStart: function () {

		$q("#gameSection").style.display = "block";
		$q("#ruleSection").style.display = "none";
		$q("#consoleContainer").classList.add("easeInRight");
		$q("#letterContainer").classList.add("easeInLeft");
		$q("#inputContainer").classList.add("easeInLeft");
		$q("#title").classList.add("easeUpTitle");
	},

	//ends changing the page  to the game (removes animation classes when it completeds )
	NavigateToGamePageEnd: function () {

		$q("#consoleContainer").classList.remove("easeInRight");
		$q("#letterContainer").classList.remove("easeInLeft");
		$q("#inputContainer").classList.remove("easeInLeft");

	},

	// changes page to home
	NavigateToHomePageStart: function () {

		$q("#consoleContainer").classList.add("easeOutRight");
		$q("#letterContainer").classList.add("easeOutLeft");
		$q("#inputContainer").classList.add("easeOutLeft");

	},

	NavigateToGroupGamePage: function(){
		$q("#gameSection").style.display="none";
		$q("#ruleSection").style.display="none";
		$q("#groupGameSection").style.display="block";
		$q("#groupGameContainer").classList.add("easeInRight");

	},
	//removes animation classes from home navigation after completion
	NavigateToHomePageEnd: function () {

		$q("#terminal").classList.remove("extendConsole");
		$q("#consoleContainer").classList.remove("easeOutRight");
		$q("#letterContainer").classList.remove("easeOutLeft");
		$q("#inputContainer").classList.remove("easeOutLeft");
		$q("#title").classList.remove("easeUpTitle");
		$q("#gameSection").style.display = "none";
		$q("#ruleSection").style.display = "block";
		DalyasGame.ShowIntro();

	},

	// shows the intro.rules via a timer
	ShowIntro: function () {

		const $body = $q("body");

		document.querySelector("#terminal").classList.remove("flattenConsole")

		DalyasGame.RenderConsoleText(DalyasGame.IntroJson.Items[0]);

		window.IntroText = window.setInterval(e => {

			const currentItem = DalyasGame.IntroJson.Items[DalyasGame.IntroIndex];
			
			DalyasGame.RenderConsoleText(currentItem);


			DalyasGame.IntroIndex = DalyasGame.IntroIndex >= DalyasGame.IntroJson.Items.length - 1 ? 0 : DalyasGame.IntroIndex + 1;

		}, 4000)


	},
	

	ResetRandomNumber: function(delay, repetitions,elementReset) {
		var x = 0;
		var intervalID = window.setInterval(function () {
	
			DalyasGame.SetRandomWord();
			elementReset();
	
		   if (++x === repetitions) {
			   window.clearInterval(intervalID);
			   DalyasGame.ClearGameText();
		   }
		}, delay);
	},

	// this writes to the console on the rules page by splitting the value and writing it char by char 
	RenderConsoleText(obj) {

		const $rulesElem = $q("#rules");
		const $currentElem = $q("#terminal");
		$rulesElem.innerHTML = obj.Text;

		if(typeof(obj.Console)==='string'){

		obj.Console.split('').forEach((item, index, arr) => {

			(function (index) {
				window.setTimeout((e) => {

					if (index === arr.length - 1 && obj.HTML !== '' && !DalyasGame.ElementIsHidden($rulesElem)) {
						$currentElem.innerHTML = obj.HTML;

					}
					else if(!DalyasGame.ElementIsHidden($rulesElem)) {
						const currentText = obj.Console.substring(0, index + 1);
						$currentElem.innerHTML = currentText;
					}


				}, 100 * index);
			})(index);
		});
	}
	else{
		obj.Console();
	}


	},

	SkipWord: function(){

		DalyasGame.WriteToConsole( `The word was ${DalyasGame.OurRandomWord.toLowerCase() }.Skipping..`);
		DalyasGame.NumberOfSkips--;
		DalyasGame.WriteToConsole( `You have ${DalyasGame.NumberOfSkips} skip(s) left`);
		if(DalyasGame.NumberOfSkips===0){
			$q("#skipWordLink").style.display="none";
		}
		DalyasGame.StartNextRound(true);

	},

	//runs after the a player has guessed the correct #, and lets them choose another
	StartNextRound: function (isSkip) {
		DalyasGame.DiscardedLetters=[];
		
		DalyasGame.SetRandomWord();
		DalyasGame.ListOfChances = [];
		if(!isSkip){
		DalyasGame.WriteToConsole( `You earned ${DalyasGame.CurrentPointValue.PointsForCurrentWord}`);
		DalyasGame.NumberOfRounds+=DalyasGame.CurrentPointValue.PointsForCurrentWord;
		}
		
		DalyasGame.WriteToConsole( `Points for word set to  ${DalyasGame.CurrentPointValue.MaxPointsForWord}`);
		DalyasGame.PointsForCurrentWord=DalyasGame.CurrentPointValue.MaxPointsForWord;
		$q("#playerScoreCount").innerHTML=DalyasGame.NumberOfRounds.toString();
		$q("#letterText").innerHTML='';

	},

	// animation that runs when the game ends
	InvokeConsoleScatter: function(){

		$q("#consoleText").insertBefore(DalyasGame.GameOverText(),$q("#consoleText").firstChild);

		window.setTimeout((e)=>{
		document.querySelectorAll(".console-comment").forEach($elem=>{

			const scatter = (Math.floor(Math.random() * 3) + 1).toString();  
			const scatterClass=`scatter-console-${scatter}`;
			if($elem.id!==undefined){
			console.log($elem.id);
			$elem.classList.add(scatterClass);
			}
		});

	},500);

	},

	SetRandomWord: function () {

	   const num= Math.floor(Math.random() *  (this.ListOfWords.length-1));
	   DalyasGame.OurRandomWord  = this.ListOfWords[num];

	},

	// this writes to the main console, and high score console. it takes the text, writes char by char, and applies 
	//the class passed in (elemClass) to apply the correct colour
	WriteToConsole: function (text, elemClass, target, timeoutTime, staggerLetters) {
		if (target === undefined) {
			target = "#consoleText";
		}
		if (timeoutTime === undefined) {
			imeoutTime=10;
		}

		let id = `comment--${Math.floor(Math.random() * 10000000)}`;
		let textElem = document.createElement("div");
		textElem.id = id;
		//textElem.innerHTML = text;
		textElem.className = elemClass;
		textElem.classList.add("console-comment");
		const parentElem = $q(target);

		$q(target).insertBefore(textElem, parentElem.firstChild);

		var $currentElem = $q("#" + id);

		text.split('').forEach((item, index) => {

			(function (index) {
				window.setTimeout((e) => {

					const currentText = text.substring(0, index + 1);
					$currentElem.innerHTML = currentText;


				}, timeoutTime * index);
			})(index);

		});


	},

	// counts down to the beginning of the game
	BeginAdvancedRound: function () {		
		DalyasGame.CountdownNumber = 0;
		$q("#gameText").setAttribute("disabled", true);

		// reset game score if this is not the first game
		DalyasGame.NumberOfRounds=0;
		DalyasGame.NumberOfSkips = DalyasGame.SkipsAllowed;
		$q("#playerScoreCount").innerHTML=DalyasGame.NumberOfRounds.toString();
		window.Countdown = setInterval(() => {


			if (DalyasGame.CountdownNumber < 3) {
				const currentCountObj = DalyasGame.CountdownObj.Items[DalyasGame.CountdownNumber];
				DalyasGame.WriteToConsole(currentCountObj.Console, "");
				currentCountObj.Action();
				DalyasGame.CountdownNumber++;

			}
			else {
				//DalyasGame.CountdownNumber = 5;gg
				clearInterval(window.Countdown);
				$q("#timer").innerHTML = "GO!";
				DalyasGame.CurrentPointValue.PointsForCurrentWord = DalyasGame.CurrentPointValue.MaxPointsForWord;
				DalyasGame.WriteToConsole(`Points allocated for current word: ${DalyasGame.CurrentPointValue.PointsForCurrentWord}`);
				DalyasGame.BeginAdvancedGame();

			}

		}, 1000)

	},

	// sets up the timer that runs the game
	BeginAdvancedGame: function () {
		DalyasGame.GameState = 'game_play';

		$q("#gameText").removeAttribute("disabled");

		DalyasGame.EndOfGame = new Date().getTime() + DalyasGame.LengthOfGameInMinutes * 60000;
		DalyasGame.FocusInputElement(false);
		$q("#inputInner").className = "has-cursor";

		window.GamePlay = setInterval(() => {

			const now = new Date().getTime();
			const t = DalyasGame.EndOfGame - now;
			if (t <= 0) {
				DalyasGame.AddLoadingIcon($q("#inputContainer"),"lds-facebook");
				$q("#inputContainerInner").style.display="none";

				window.clearInterval(window.GamePlay);
				DalyasGame.InvokeConsoleScatter();

				window.setTimeout(()=>{
				
				$q("#consoleText").innerHTML='';
				DalyasGame.CheckForHighScore();
				},2000);
			}
			else {

				// set point count for player
				// if th
				const decreasePointValue=DalyasGame.CurrentPointValue.SecondIndex===DalyasGame.CurrentPointValue.SecondsForPointChange;
				if(decreasePointValue &&  DalyasGame.CurrentPointValue.PointsForCurrentWord>1){
					DalyasGame.CurrentPointValue.PointsForCurrentWord --;
					DalyasGame.CurrentPointValue.SecondIndex=0;
					DalyasGame.WriteToConsole( `Points for current word: ${DalyasGame.CurrentPointValue.PointsForCurrentWord}`,"bonus");
				}
				if(!decreasePointValue){
					DalyasGame.CurrentPointValue.SecondIndex++;
				}

				DalyasGame.SetCountdownClock(t);
			}

		}, 1000);

	},


	ClearGameText: function () {
		$q("#gameText").value = "";
	},


	InitGameOver: function () {

		DalyasGame.GameState = 'game_over';

		$q("#consoleText").innerHTML = "";
		$q("#inputInner").classList.add("has-cursor");
		DalyasGame.FocusInputElement(false);
		DalyasGame.ClearGameText()
		DalyasGame.ClearSvgValues();
		$q("#letterText").innerHTML='';
		DalyasGame.WriteToConsole(`The final word was ${DalyasGame.OurRandomWord}`);
		DalyasGame.WriteToConsole(`If you would like to play again, type YES into the input box.
								 To go back to the homepage and high, scores, type NO `, "info");
		DalyasGame.ClearGameText();
	},

	// adds seconds if a player has gotten a bonus
	AddSecondsToTime: function (timeAddedInSeconds) {

		for (let i = 0; i <= timeAddedInSeconds; i++) {

			(function (i) {
				window.setTimeout((e) => {
					DalyasGame.EndOfGame += 1000;
					const t = DalyasGame.EndOfGame - new Date().getTime();;
					DalyasGame.SetCountdownClock(t);

				}, 10 * i);

			})(i);

		}

	},

	SetCountdownClock: function (t) {
		let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
		let seconds = (Math.floor((t % (1000 * 60)) / 1000)).toString();

		seconds = parseInt(seconds) < 10 ? '0' + seconds : seconds;


		$q("#timer").innerHTML = `${minutes}:${seconds}`;

	},


	// loops through the high scores and checks if this score falls in top 10
	HasHighScore:function(score, highscores){

		
		let hasHighScore = false;

		for(let i =0; i< highscores.length;i++){

			if(score > highscores[i].highscore){

				DalyasGame.CurrentRank = (i+1);
				hasHighScore=true;
				break;
			}
		}


		if(hasHighScore === false && highscores.length<10 && score>0){
			console.log(highscores.length);
			DalyasGame.CurrentRank = (highscores.length+1);
			hasHighScore =  true;
		}

		return hasHighScore;

	},

	// gets current scores from db. if the player is in the highscore list, 
	//allow player to add initials. Otherwise continue to game over
	CheckForHighScore: function (score) {

		fetch(`${DalyasGame.HighScoresEndpoint}/getscores`)
			.then((result)=>result.json())
			.then((data)=>{
				DalyasGame.RemoveLoadingIcon( $q("#inputContainer"),"lds-facebook");
				$q("#inputContainerInner").style.display="block";
				const hasHighScore = DalyasGame.HasHighScore(DalyasGame.NumberOfRounds,data);
				if (!hasHighScore) {
					this.InitGameOver();
				}
				else {
					DalyasGame.GameState = 'high_score';
					document.querySelector("#inputInner").classList.add("has-cursor");
					DalyasGame.FocusInputElement(false);
					//$q("#inputAction").innerHTML = "initials";
					DalyasGame.WriteToConsole(`Congratulations! you are ranked number ${DalyasGame.CurrentRank} on our list of all time champs!
													Please enter your initials`, "bonus");
				}			


			});

		const higherScores = DalyasGame.HighScores.filter(e => e >= score);
		return higherScores.length;
	},

	// puts focus on input element for each turn. disabled on mobile because the keyboard pops up and hides console
	FocusInputElement:function(allowMobileFocus){
		if(this.IsDesktop || allowMobileFocus){

			$q("#gameText").focus();
		}
	},

	//sends high score to db
	SetScores: function (initials) {
		DalyasGame.AddLoadingIcon($q("#inputContainer"),"lds-facebook");
		$q("#inputContainerInner").style.display="none";
		fetch(`${DalyasGame.HighScoresEndpoint}/logscores`, {
			mode:'no-cors',
  			method: 'post',
 			 headers: {
   			 'Accept': 'application/json, text/plain, */*',
   			 'Content-Type': 'application/json'
  			},
  			body: JSON.stringify({name: initials, highscore: DalyasGame.NumberOfRounds})
			}).then((res)=>{
				DalyasGame.RemoveLoadingIcon( $q("#inputContainer"),"lds-facebook");
				$q("#inputContainerInner").style.display="block";
				if(res.ok){
					DalyasGame.WriteToConsole(`High score successfully added for ${initials}`,"info");
				}
				else{
					DalyasGame.WriteToConsole("Sorry, could not add high score","error");
				}

				DalyasGame.InitGameOver();

			});
  			
	},

	DisplayInputResults: function ($gameTextElem, text, className) {

		const emojis = document.querySelectorAll(".game-emoji");
		
		for(const emoji of emojis){
			emoji.classList.add("flatten-emoji");
		}		
		window.setTimeout(e => {
			$gameTextElem.value = "";
	
			$q("#gameText").style.visibility="visible";
			//$q("#mainBody label").style.display="block";
			$q("#inputInner").className = "has-cursor";
			
			DalyasGame.WriteToConsole(text, className);
			$q("#gameText").focus();
		}, 1000);


	},

	//taken from https://stackoverflow.com/questions/8335834/how-can-i-hide-the-android-keyboard-using-javascript
	HideKeyboard: function () {
		//this set timeout needed for case when hideKeyborad
		//is called inside of 'onfocus' event handler
		setTimeout(function () {

			//creating temp field
			var field = document.createElement('input');
			field.setAttribute('type', 'text');
			//hiding temp field from peoples eyes
			//-webkit-user-modify is nessesary for Android 4.x
			field.setAttribute('style', 'position:absolute; top: 0px; opacity: 0; -webkit-user-modify: read-write-plaintext-only; left:0px;');
			document.body.appendChild(field);

			//adding onfocus event handler for out temp field
			field.onfocus = function () {
				//this timeout of 200ms is nessasary for Android 2.3.x
				setTimeout(function () {

					field.setAttribute('style', 'display:none;');
					setTimeout(function () {
						document.body.removeChild(field);
						document.body.focus();
					}, 14);

				}, 200);
			};
			//focusing it
			field.focus();

		}, 50);
	},

	// gets the high scores from the db and displays them on the highscore console
	DisplayScores: function () {
		if (window.IntroText) {
			window.clearInterval(window.IntroText);
		}

		const $terminal = $q("#terminal");
		let advancedText = '';
		$terminal.innerHTML = '';
		DalyasGame.AddLoadingIcon($terminal,"lds-facebook");
		
		fetch(`${DalyasGame.HighScoresEndpoint}/getscores`)
			.then((result)=>result.json())
			.then((data)=>{

				DalyasGame.RemoveLoadingIcon($terminal,"lds-facebook");
				DalyasGame.HighScores = data;
		if(DalyasGame.HighScores.length===0){

			DalyasGame.WriteToConsole('<h3>No High Scores</h3>', "high-score-item", "#terminal");
			return;
		}

		for (let i = DalyasGame.HighScores.length - 1; i >= 0; i--) {

			if (i === 0) {
				advancedText = '<h3>High Scores</h3>';
			}

			advancedText += `${DalyasGame.HighScores[i].name} - ${DalyasGame.HighScores[i].highscore}<br/>`;
			console.log(advancedText);
			DalyasGame.WriteToConsole(advancedText, "high-score-item", "#terminal");
			advancedText = '';

		}
	});


	},

	ElementIsHidden: function ($el) {
		return $el.offsetParent === null;

	},

	AddLoadingIcon:function($parent, icon)
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

	},

	RemoveLoadingIcon:function($parent,icon)
	{	
		const $elem = $q(`.${icon}`);
		if($elem!==null){
			$parent.removeChild($elem);
		}
	},


	// this the primary function for guessing an item. it gets the input value
	// checks if input correct, and then processes result
	MakeSelection: function () {

		DalyasGame.HideKeyboard();
		let $gameTextElem = $q("#gameText");

		const regex = /^[a-zA-Z]{3}$/;
		let gameText = $gameTextElem.value;
		if (!regex.test(gameText)) {
			DalyasGame.WriteToConsole("Invalid entry", "error");
		}
		else {

			//take the number that the we made and split it into 3 piecies
			//take the number computer made and split that into 3 pieces
			//then compare the computer number against our number

			let whatIsHappening = 'The computer has word' + DalyasGame.OurRandomWord + ' and we have chosen ' + gameText;

			let ourGameText = gameText.split('');

			let resultsCode = '';

			let computerGameText = DalyasGame.OurRandomWord.split('');

			$gameTextElem.value = '';

			if (DalyasGame.OurRandomWord.toString().toLowerCase() === gameText.toLowerCase()) {

				DalyasGame.DisplayInputResults($gameTextElem, "Congrats! Code successfully unlocked. Resetting to new number", "victory");
				DalyasGame.ResetRandomNumber(40,12,()=>{$q("#gameText").value = DalyasGame.OurRandomWord;});


				if (DalyasGame.ListOfChances.length < 4) {

					DalyasGame.DisplayInputResults($gameTextElem, "30 second bonus for guessing in under 4 tries", "bonus");
					DalyasGame.AddSecondsToTime(30);
				}
				else if (DalyasGame.ListOfChances.length > 3 && DalyasGame.ListOfChances.length < 7) {

					DalyasGame.DisplayInputResults($gameTextElem, "15 second bonus for guessing in under 7 tries", "bonus");
					DalyasGame.AddSecondsToTime(15);

				}
				DalyasGame.ClearSvgValues();
				DalyasGame.StartNextRound();
				return;

			}

			for (let i = 0; i < 3; i++) {
				//check our number against the computers number
				if (ourGameText[i].toLowerCase() === computerGameText[i].toLowerCase() ) {
					whatIsHappening += `<br/>Number ${i + 1} was right!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += '&#128522;';
					DalyasGame.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(),'right');

					$q("#resultImg-"+i).innerHTML=$happySvg;

				}
				else if ((ourGameText[i].toLowerCase() !== computerGameText[i].toLowerCase()) && DalyasGame.OurRandomWord.toLowerCase().indexOf(ourGameText[i].toLowerCase()) !== -1) {
					whatIsHappening += `<br/>Number ${i + 1} not totally right - it is there, but not in the same place!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += '&#128579;';
					DalyasGame.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(),'almost');
					$q("#resultImg-"+i).innerHTML=$closeSvg;

				}
				else {
					whatIsHappening += `<br/>Number ${i + 1} was wrong!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += '&#128577;';
					DalyasGame.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(),'wrong');
					$q("#resultImg-"+i).innerHTML=$angrySvg;

				}

			}

			resultsCode = `${resultsCode} (${gameText})`;

			DalyasGame.ListOfChances.push(resultsCode);

			DalyasGame.WriteDiscardedLettersToScreen();


			//$gameTextElem.value = resultsCode.split(' ')[0];
		
			if(DalyasGame.TestMode){
			console.log(whatIsHappening);
			}

			//show the emoji results
			//$q("#mainBody label").style.display="none";
			$q("#resultsDisplay").style.display="flex";
			$q("#gameText").style.visibility="hidden";

			DalyasGame.DisplayInputResults($gameTextElem, `Code ${resultsCode} for letter ${gameText} (attempt ${DalyasGame.ListOfChances.length})`, "results");

			//give incentive to get bonus points
			if (DalyasGame.ListOfChances.length === 2) {
				DalyasGame.WriteToConsole("One more chance for 30 second bonus", "bonus");
			}

			//give incentive to get bonus points
			if (DalyasGame.ListOfChances.length === 5) {
				DalyasGame.WriteToConsole("One more chance for 15 second bonus", "bonus");
			}

		}

	},
	

	WriteDiscardedLettersToScreen(){

		const spanOpen = (exp)=>`<span class="${exp} discarded-letter">`;
		const spanClose="</span>"
		const joinVal = DalyasGame.DiscardedLetters.reduce((t,c)=>  t + `${spanOpen(c.val)}${c.letter}${spanClose}` ,'');
		$q("#letterText").innerHTML=joinVal;
	},


	//the hs buttom alternatives between rules and high scores, change back and forth between keypress
	ToggleHighScoreButton:function(){
		let $rulesElem = $q("#rules");
		let $terminalElem = $q("#terminal");
		let $button = $q("#highScoreButton");

		if (DalyasGame.ElementIsHidden($rulesElem)) {
			$rulesElem.style.display = "block";
			$terminalElem.classList.remove("extendConsole");
			$terminalElem.classList.add("flattenConsole");
			$button.innerHTML = "High Scores";
			DalyasGame.ShowIntro();

		}
		else {
			$rulesElem.style.display = "none";
			$terminalElem.classList.add("extendConsole");
			$button.innerHTML = "See Rules";

		}
	},

	HandleKeyPressEvent:function(event){

		if (event.target.value.length >= 3 && DalyasGame.GameState === 'game_play') {
			DalyasGame.MakeSelection();
		}
		else if (event.target.value.toUpperCase() === 'YES' && DalyasGame.GameState === 'game_over') {
			DalyasGame.Init();
		}
		else if (event.target.value.toUpperCase() === 'NO' && DalyasGame.GameState === 'game_over') {
			DalyasGame.NavigateToHomePageStart();
		}
		else if (event.target.value.length == 3 && DalyasGame.GameState === 'high_score') {
			DalyasGame.SetScores(event.target.value);
		}
	},

	// checks which css animation has completed and routes to correct fn
	HandleAnimationEnding:function(e){
		switch (e.animationName) {

			case 'extend-console':
				DalyasGame.DisplayScores();
				break;
			case 'ease-left':
				DalyasGame.NavigateToGamePageEnd();
				break;
			case 'ease-out-left':
				DalyasGame.NavigateToHomePageEnd();
				break;
			case 'flatten-console':
				DalyasGame.ShowIntro();
				break;
			case 'ease-up':
				$q("#legend").classList.remove("easeUpLegend");
				break;
			case 'flatten-emoji':
				const emojis = document.querySelectorAll(".game-emoji");
				for(const emoji of emojis){
					emoji.classList.add("flatten-emoji");
				}	
				$q("#resultsDisplay").style.height="10px";
				break;
		}
	},

	GameOverText:function(){

		let $elem = document.createElement("div");
		let $innerElem = document.createElement("pre");
		$elem.appendChild($innerElem);
		$elem.className="gameOver";
		if(window.matchMedia('(min-width: 961px)').matches){

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
	},

	PushToDiscardedLetterArray(letter, val){
		 DalyasGame.DiscardedLetters= DalyasGame.DiscardedLetters.filter(e=>e.letter!==letter);
		 DalyasGame.DiscardedLetters.push({letter,val});

	},
	
	CreateRandomNames:function(){
		const wordCount = DalyasGame.ListOfWords.length-1;
		const wordArr=[];
		for(i=0;i<3;i++){
			const rand = Math.floor(Math.random() * wordCount);
			wordArr.push(DalyasGame.ListOfWords[rand]);
		}
		return wordArr.join('');
	},

	BuildRandomNameUI(id,val){

		let alphabet='abcdefghijklmnopqrstuvwxyz'.split('');
		let valArr = val.split('');
		let itemFound=[];
		for(i=0;i<valArr.length;i++){
			itemFound.push('');
		}
		let counter=0;

		window.NameUI[val]=setInterval(function(counter) {
			return function() {
				
				if(counter === alphabet.length){
					console.log('Stopping Array')
					window.clearInterval(window.NameUI[val]);
				}

				const currentLetter = alphabet[counter];
				console.log('Current Letter is '+ currentLetter );
				const currentWordArr=[];

				for (i=0;i<valArr.length;i++){
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
				const $currentElem = $q("#" + id);
				$currentElem.innerHTML = currentWord;
				
				++counter;
			};
		}(0), 50);

	},

	ClearSvgValues(){

		for(i=0;i<3;i ++){
		$q("#resultImg-"+i).innerHTML='';
		}
	},

	IsDesktop:function(){
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