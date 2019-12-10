const IntroJson = {
	Items:[
		{'Console' : '???','Text':'The computer has chosen a random number between 100 and 1000.', 'emp':''},
		{'Console' : '123','Text':'You need to guess what it is.','emp':''},
		{'Console' : 'BTF','Text':'The computer will give you a code with some clues. ','emp':''},
		{'Console' : 'BTF','Text':'The code B means the digit is not in the number.', 'emp':'B'},
		{'Console' : 'BTF','Text':'The code T means the digit is in the number, but in the wrong place.','emp':'T'},
		{'Console' : 'BTF','Text':'F Means the digit is in the right place.','emp':'F'},
		{'Console' : '283','Text':'Your goal is to get FFF as many times as you can in 2 minutes.','emp':''},
		{'Console' : 'FFF','Text':'Are you ready to accept the challenge?','emp':'BFT'}



	]

}

const CountdownObj = {

Items:[
	{'Console':'Setting up RandomNumbers...', 'Action': () => { 
		
		window.InitInput = window.setInterval( (event)=>{

			DalyasGame.SetRandomNumber();
			document.querySelector("#gameText").value = DalyasGame.OurRandomNumber;

		},40);
	}},
	{'Console':'Allocating game time...', 'Action': () => { 
		
		

			let currentNumElem = document.querySelector("#timer");
			currentNumElem.innerHTML='00:00';
	}},

	{
		'Console':'Finalizing Game...','Action':()=>{

			window.clearInterval(window.InitInput);
			document.querySelector("#gameText").value = '';
		}
	}



]

}

const DalyasGame = {
			HighScores: { beginner: [], advanced: [] },
			PlayerName: 'unknown',
			OurRandomNumber: 0,// 
			ListOfChances: [],
			NumberOfRounds: 0,
			DialogElem: {},
			IntroIndex:0,
			Level: 'beginner',
			CurrentTime: 0,
			CountdownNumber: 0,
			LengthOfGameInMinutes: 2,
			EndOfGame: {},

			Init: function () {

				if (window.IntroText){
				window.clearInterval(window.IntroText);
				}
				document.querySelector("#gameSection").style.display ="block";
				document.querySelector("#ruleSection").style.display="none";
				DalyasGame.SetRandomNumber();
				DalyasGame.ListOfChances = [];
				DalyasGame.NumberOfRounds = 0;
				DalyasGame.GetScores();
				DalyasGame.BeginAdvancedRound();
				//DalyasGame.DisplayScores();
				//DalyasGame.ShowModal("Select a name and level to begin");



			},

			ShowIntro:function(){

				window.IntroText = window.setInterval(e =>{

					const currentItem = IntroJson.Items[DalyasGame.IntroIndex];
					const consoleText = DalyasGame.RenderConsoleText(currentItem);
					document.querySelector("#terminal").innerHTML =consoleText;
					document.querySelector("#rules").innerHTML = currentItem.Text;
					
					DalyasGame.IntroIndex = DalyasGame.IntroIndex >= IntroJson.Items.length-1 ?0 : DalyasGame.IntroIndex+1;

				}, 3000)


			},

			RenderConsoleText(obj){


			 let console =  obj.Console.split('')
										.map(e=> obj.emp.indexOf(e)!==-1? `<span class='emphasis'>${e }</span>`: e)
										.join('');
					

			 return console;
			},

			ShowModal: function (msg) {



				document.querySelector("#dialog-message").innerHTML = msg;
				DalyasGame.DialogElem.showModal();


			},

			StartNextRound: function () {

				DalyasGame.SetRandomNumber();
				DalyasGame.ListOfChances = [];
				document.querySelector("#results").innerHTML = "<span class='bignews'>You got it! Keep Going!</span>";
				DalyasGame.NumberOfRounds++;
				document.querySelector("#round").innerHTML = DalyasGame.NumberOfRounds;
				;


			},

			SetRandomNumber: function () {

				DalyasGame.OurRandomNumber = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;

			},

			WriteToConsole: function(text, elemClass){

				let textElem = document.createElement("div");
				//textElem.classList.add(elemClass,"consoleInner");
				textElem.innerHTML = text;
				const parentElem = document.querySelector("#consoleText");

				document.querySelector("#consoleText").insertBefore(textElem,parentElem.firstChild);



			},

			GetScores: function () {

				const highScores = localStorage.getItem('highScores');

				if (highScores) {
					DalyasGame.HighScores = JSON.parse(highScores);
				}

			},

			BeginAdvancedRound: function () {

				DalyasGame.CountdownNumber = 0;
				document.querySelector("#gameText").setAttribute("disabled", true);
				window.Countdown = setInterval(() => {


					if (DalyasGame.CountdownNumber <3) {
						const currentCountObj = CountdownObj.Items[DalyasGame.CountdownNumber];
						DalyasGame.WriteToConsole(currentCountObj.Console,"");
						currentCountObj.Action();
						DalyasGame.CountdownNumber++;

					}
					else {
						//DalyasGame.CountdownNumber = 5;
						clearInterval(window.Countdown);
						document.querySelector("#timer").innerHTML = "GO!";
						document.querySelector("#round").innerHTML = DalyasGame.NumberOfRounds;
						DalyasGame.BeginAdvancedGame();

					}

				}, 1000)

			},

			BeginAdvancedGame: function () {

				document.querySelector("#gameText").removeAttribute("disabled");

				DalyasGame.EndOfGame = new Date().getTime() + DalyasGame.LengthOfGameInMinutes * 60000;

				window.GamePlay = setInterval(() => {

					const now = new Date().getTime();
					const t = DalyasGame.EndOfGame - now;


					if (t < 0) {

						window.clearInterval(window.GamePlay);
						DalyasGame.SetScores(DalyasGame.NumberOfRounds);
						DalyasGame.Init();
						//DalyasGame.ShowModal(`Game Over! You got ${DalyasGame.NumberOfRounds}. <br/> Want to play again ?` );
					}
					else {

						let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
						let seconds = (Math.floor((t % (1000 * 60)) / 1000)).toString();

						seconds = parseInt(seconds) < 10 ? '0' + seconds : seconds;


						document.querySelector("#timer").innerHTML = `${minutes}:${seconds}`;

					}

				}, 1000);


			},

			SetScores: function (points) {

				DalyasGame.HighScores[DalyasGame.Level].push({ Name: DalyasGame.PlayerName, Score: points });

				DalyasGame.HighScores[DalyasGame.Level] = DalyasGame.HighScores[DalyasGame.Level]
					.filter(e => e.Score > 0)
					.sort((a, b) => b.Score - a.Score)
					.splice(0, 3);

				localStorage.setItem('highScores', JSON.stringify(DalyasGame.HighScores));

				DalyasGame.DisplayScores();
			},

			DisplayScores: function () {

				let beginnerText = '';
				let advancedText = '';

				DalyasGame.HighScores.beginner.forEach((item) => {

					beginnerText += `${item.Name} - ${item.Score}<br/>`;

				});

				document.querySelector("#beginner-scores").innerHTML = beginnerText;

				DalyasGame.HighScores.advanced.forEach((item) => {

					advancedText += `${item.Name} - ${item.Score}<br/>`;

				});

				document.querySelector("#advanced-scores").innerHTML = advancedText;


			},

			MakeSelection: function () {

				let $resultsElem = document.querySelector("#results");
				let $gameTextElem = document.querySelector("#gameText");


				let gameText = $gameTextElem.value;
				if (gameText.length !== 3) {
					DalyasGame.WriteToConsole("Sorry, you were supposed to put in 3 characters, but you screwed up! Try Again !","error");
					$gameTextElem.value ="";
				
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

						if (DalyasGame.Level === 'beginner') {
							DalyasGame.ShowModal('Congratulations! you have won the game in ' + DalyasGame.ListOfChances.length + ' turns!<br/> Want to play again?');
							DalyasGame.SetScores(DalyasGame.ListOfChances.length);
							return;
						}
						else {

							DalyasGame.StartNextRound();
							return;
						}


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

					$gameTextElem.value=resultCode
					$resultsElem.innerHTML = DalyasGame.ListOfChances.join('<br/>');
					console.log(whatIsHappening);
					$gameTextElem.focus();

				}

			}

		}