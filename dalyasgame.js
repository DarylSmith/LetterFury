const $q = document.querySelector.bind(document);

const IntroJson = {
	Items: [
		{ 'Console': '???', 'Text': 'The computer has chosen a random number between 100 and 1000.', 'HTML': '' },
		{ 'Console': '123', 'Text': 'You need to guess what it is.', 'HTML': '' },
		{ 'Console': 'BTF', 'Text': 'The computer will give you a code with some clues. ', 'HTML': '' },
		{ 'Console': 'BTF', 'Text': 'The code B means the digit is not in the number.', 'HTML': '<span class="emphasis">B</span>TF' },
		{ 'Console': 'BTF', 'Text': 'The code T means the digit is in the number, but in the wrong place.', 'HTML': 'B<span class="emphasis">T</span>F' },
		{ 'Console': 'BTF', 'Text': 'F Means the digit is in the right place.', 'HTML': 'BT<span class="emphasis">F</span>' },
		{ 'Console': '123', 'Text': 'Your goal is to get FFF as many times as you can in 2 minutes.', 'HTML': '' },
		{ 'Console': 'FFF', 'Text': 'Are you ready to accept the challenge?', 'HTML': '<span class="emphasis">FFF</span>' }



	]

}

const CountdownObj = {

	Items: [
		{
			'Console': 'Setting up RandomNumbers...', 'Action': () => {

				window.InitInput = window.setInterval((event) => {

					DalyasGame.SetRandomNumber();
					$q("#gameText").value = DalyasGame.OurRandomNumber;

				}, 40);
			}
		},
		{
			'Console': 'Allocating game time...', 'Action': () => {



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

}

const DalyasGame = {
	HighScores: [],
	PlayerName: 'unknown',
	OurRandomNumber: 0,// 
	ListOfChances: [],
	NumberOfRounds: 0,
	DialogElem: {},
	IntroIndex: 0,
	NumberOfHighScores: 10,
	GameState: 'intro',
	CurrentTime: 0,
	CountdownNumber: 0,
	LengthOfGameInMinutes: 2,
	EndOfGame: {},

	Init: function () {

		if (window.IntroText) {
			window.clearInterval(window.IntroText);
		}

		if (DalyasGame.ElementIsHidden($q("#gameSection"))) {

			DalyasGame.NavigateToGamePageStart();
		}
		$q("#consoleText").innerHTML = 'Resetting Game...';
		DalyasGame.SetRandomNumber();
		DalyasGame.ListOfChances = [];
		DalyasGame.NumberOfRounds = 0;
		DalyasGame.GetScores();
		DalyasGame.BeginAdvancedRound();
		$q("#inputAction").innerHTML ="guess";
		$q("#gameText").focus();
		//DalyasGame.DisplayScores();
		//DalyasGame.ShowModal("Select a name and level to begin");



	},

	NavigateToGamePageStart: function () {

		$q("#gameSection").style.display = "block";
		$q("#ruleSection").style.display = "none";
		$q("#consoleContainer").classList.add("easeInRight");
		$q("#timerContainer").classList.add("easeInLeft");
		$q("#inputContainer").classList.add("easeInLeft");
		$q("#legend").classList.add("easeUpLegend");
	},

	NavigateToGamePageEnd: function () {

		$q("#consoleContainer").classList.remove("easeInRight");
		$q("#timerContainer").classList.remove("easeInLeft");
		$q("#inputContainer").classList.remove("easeInLeft");

	},

	NavigateToHomePageStart: function () {

		$q("#consoleContainer").classList.add("easeOutRight");
		$q("#timerContainer").classList.add("easeOutLeft");
		$q("#inputContainer").classList.add("easeOutLeft");

	},

	NavigateToHomePageEnd: function () {

		$q("#terminal").classList.remove("extendConsole");
		$q("#consoleContainer").classList.remove("easeOutRight");
		$q("#timerContainer").classList.remove("easeOutLeft");
		$q("#inputContainer").classList.remove("easeOutLeft");
		$q("#gameSection").style.display = "none";
		$q("#ruleSection").style.display = "block";
		DalyasGame.ShowIntro();

	},

	ShowIntro: function () {

		document.querySelector("#terminal").classList.remove("flattenConsole")

		window.IntroText = window.setInterval(e => {

			const currentItem = IntroJson.Items[DalyasGame.IntroIndex];
			DalyasGame.RenderConsoleText(currentItem);


			DalyasGame.IntroIndex = DalyasGame.IntroIndex >= IntroJson.Items.length - 1 ? 0 : DalyasGame.IntroIndex + 1;

		}, 2500)


	},

	RenderConsoleText(obj) {

		const $currentElem = $q("#terminal");
		$q("#rules").innerHTML = obj.Text;


		obj.Console.split('').forEach((item, index, arr) => {

			(function (index) {
				window.setTimeout((e) => {

					if (index === arr.length - 1 && obj.HTML !== '') {
						$currentElem.innerHTML = obj.HTML;

					}
					else {
						const currentText = obj.Console.substring(0, index + 1);
						$currentElem.innerHTML = currentText;
					}


				}, 100 * index);
			})(index);
		});

	},


	StartNextRound: function () {

		DalyasGame.SetRandomNumber();
		DalyasGame.ListOfChances = [];
		DalyasGame.NumberOfRounds++;
	
	},

	SetRandomNumber: function () {

		DalyasGame.OurRandomNumber = Math.floor(Math.random() * (999 - 100 + 1)) + 100;

	},

	WriteToConsole: function (text, elemClass, target) {
		if (target === undefined) {
			target = "#consoleText";
		}

		let id = `comment--${Math.floor(Math.random() * 10000000)}`;
		let textElem = document.createElement("div");
		textElem.id = id;
		//textElem.innerHTML = text;
		textElem.className = elemClass;
		const parentElem = $q(target);

		$q(target).insertBefore(textElem, parentElem.firstChild);

		var $currentElem = $q("#" + id);

		text.split('').forEach((item, index) => {

			(function (index) {
				window.setTimeout((e) => {

					const currentText = text.substring(0, index + 1);
					$currentElem.innerHTML = currentText;


				}, 10 * index);
			})(index);

		});


	},

	GetScores: function () {

		const highScores = localStorage.getItem('highScores');

		if (highScores) {
			DalyasGame.HighScores = JSON.parse(highScores);
		}

	},

	BeginAdvancedRound: function () {

		DalyasGame.CountdownNumber = 0;
		$q("#gameText").setAttribute("disabled", true);
		window.Countdown = setInterval(() => {


			if (DalyasGame.CountdownNumber < 3) {
				const currentCountObj = CountdownObj.Items[DalyasGame.CountdownNumber];
				DalyasGame.WriteToConsole(currentCountObj.Console, "");
				currentCountObj.Action();
				DalyasGame.CountdownNumber++;

			}
			else {
				//DalyasGame.CountdownNumber = 5;
				clearInterval(window.Countdown);
				$q("#timer").innerHTML = "GO!";
				DalyasGame.BeginAdvancedGame();

			}

		}, 1000)

	},

	BeginAdvancedGame: function () {
		DalyasGame.GameState = 'game_play';

		$q("#gameText").removeAttribute("disabled");

		DalyasGame.EndOfGame = new Date().getTime() + DalyasGame.LengthOfGameInMinutes * 60000;
		$q("#gameText").focus();
		$q("#inputInner").className = "has-cursor";

		window.GamePlay = setInterval(() => {

			const now = new Date().getTime();
			const t = DalyasGame.EndOfGame - now;
			if (t <= 0) {

				window.clearInterval(window.GamePlay);
				DalyasGame.WriteToConsole(`Game Over! You have ${DalyasGame.NumberOfRounds} points!`, "");
				const currentRank = DalyasGame.HasHighScore(DalyasGame.NumberOfRounds);
				if (currentRank > 10) {
					this.InitGameOver();
				}
				else {
				DalyasGame.GameState = 'high_score';

				$q("#inputAction").innerHTML ="initials";
					DalyasGame.WriteToConsole(`Congratulations! you are ranked number ${currentRank + 1} on our list of all time champs!
													Please enter your initials`, "bonus");
				}
			}
			else {

				DalyasGame.SetCountdownClock(t);
			}

		}, 1000);

	},

	InitGameOver: function () {

		DalyasGame.GameState = 'game_over';
		$q("#gameText").innerHTML="___";
		$q("#consoleText").innerHTML="";
		DalyasGame.WriteToConsole(`If you would like to play again, type YES into the input box.
								 To go back to the homepage and high, scores, type NO `,"info");
	},

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

	HasHighScore: function (score) {

		const higherScores = DalyasGame.HighScores.filter(e => e >= score);
		return higherScores.length;
	},

	SetScores: function (initials) {

		DalyasGame.HighScores.push({ Name: initials, Score: DalyasGame.NumberOfRounds });
		DalyasGame.HighScores = DalyasGame.HighScores
			.filter(e => e.Score > 0)
			.sort((a, b) => b.Score - a.Score)
			.splice(0, DalyasGame.NumberOfHighScores);

		console.log(DalyasGame.HighScores);

		localStorage.setItem('highScores', JSON.stringify(DalyasGame.HighScores));

		DalyasGame.InitGameOver();
	},

	DisplayInputResults: function ($gameTextElem, text, className) {

		window.setTimeout(e => {
			$gameTextElem.value = "";
			$q("#inputInner").className = "has-cursor";
			$gameTextElem.focus();
			DalyasGame.WriteToConsole(text, className);
		}, 500);


	},

	//taken from https://stackoverflow.com/questions/8335834/how-can-i-hide-the-android-keyboard-using-javascript
	HideKeyboard:function() {
		//this set timeout needed for case when hideKeyborad
		//is called inside of 'onfocus' event handler
		setTimeout(function() {
	  
		  //creating temp field
		  var field = document.createElement('input');
		  field.setAttribute('type', 'text');
		  //hiding temp field from peoples eyes
		  //-webkit-user-modify is nessesary for Android 4.x
		  field.setAttribute('style', 'position:absolute; top: 0px; opacity: 0; -webkit-user-modify: read-write-plaintext-only; left:0px;');
		  document.body.appendChild(field);
	  
		  //adding onfocus event handler for out temp field
		  field.onfocus = function(){
			//this timeout of 200ms is nessasary for Android 2.3.x
			setTimeout(function() {
	  
			  field.setAttribute('style', 'display:none;');
			  setTimeout(function() {
				document.body.removeChild(field);
				document.body.focus();
			  }, 14);
	  
			}, 200);
		  };
		  //focusing it
		  field.focus();
	  
		}, 50);
	  },

	DisplayScores: function () {
		if (window.IntroText) {
			window.clearInterval(window.IntroText);
		}

		
		let advancedText = '';
		$q("#terminal").innerHTML = '';
	

			for(let i=DalyasGame.HighScores.length-1;i>=0; i--){

				if(i===0){
					advancedText='<h3>High Scores</h3>';
				}

			advancedText += `${DalyasGame.HighScores[i].Name} - ${DalyasGame.HighScores[i].Score}<br/>`;
			console.log(advancedText);
			DalyasGame.WriteToConsole(advancedText, "high-score-item", "#terminal");
			advancedText='';

		};


	},

	ElementIsHidden: function (el) {
		return el.offsetParent === null;

	},

	MakeSelection: function () {
		
		if(window.matchMedia("(max-width:961px)")){

			document.location="#game";
		}
		DalyasGame.HideKeyboard();
		let $gameTextElem = $q("#gameText");

		const regex = /^\d{3}$/;
		let gameText = $gameTextElem.value;
		if (!regex.test(gameText)) {
			DalyasGame.WriteToConsole("Invalid entry - 5 second penalty!", "error");
			DalyasGame.AddSecondsToTime(-5);
			$gameTextElem.value = "";
			$q("#inputInner").className = "has-cursor";
			$gameTextElem.focus();

		}
		else {

			//take the number that the we made and split it into 3 piecies
			//take the number computer made and split that into 3 pieces
			//then compare the computer number against our number

			let whatIsHappening = 'The computer has number' + DalyasGame.OurRandomNumber + ' and we have chosen ' + gameText;

			let ourGameText = gameText.split('');

			let resultsCode = '';

			let computerGameText = DalyasGame.OurRandomNumber.toString().split('');

			$gameTextElem.value = '';

			if (DalyasGame.OurRandomNumber.toString() === gameText) {

				DalyasGame.DisplayInputResults($gameTextElem, "Congrats! Code successfully unlocked. Resetting to new number", "victory");



				if (DalyasGame.ListOfChances.length < 4) {

					DalyasGame.DisplayInputResults($gameTextElem, "30 second bonus for guessing in under 4 tries", "bonus");
					DalyasGame.AddSecondsToTime(30);
				}
				else if (DalyasGame.ListOfChances.length > 3 && DalyasGame.ListOfChances.length < 7) {

					DalyasGame.DisplayInputResults($gameTextElem, "15 second bonus for guessing in under 7 tries", "bonus");
					DalyasGame.AddSecondsToTime(15);

				}
				DalyasGame.StartNextRound();
				return;

			}

			for (let i = 0; i < 3; i++) {
				//check our number against the computers number
				if (ourGameText[i] === computerGameText[i]) {
					whatIsHappening += `<br/>Number ${i + 1} was right!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += 'F';

				}
				else if ((ourGameText[i] !== computerGameText[i]) && DalyasGame.OurRandomNumber.toString().indexOf(ourGameText[i]) !== -1) {
					whatIsHappening += `<br/>Number ${i + 1} not totally right - it is there, but not in the same place!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
					resultsCode += 'T';
				}
				else {
					whatIsHappening += `<br/>Number ${i + 1} was wrong!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;

					resultsCode += 'B';

				}

			}

			resultsCode = `${resultsCode} (${gameText})`;

			DalyasGame.ListOfChances.push(resultsCode);

			$gameTextElem.value = resultsCode
			//$resultsElem.innerHTML = DalyasGame.ListOfChances.join('<br/>');
			console.log(whatIsHappening);

			DalyasGame.DisplayInputResults($gameTextElem, `Code ${resultsCode} for number ${gameText} (attempt ${DalyasGame.ListOfChances.length})`, "results");


		}

	}

}