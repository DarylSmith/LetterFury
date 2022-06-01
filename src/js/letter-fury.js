"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LetterFury = void 0;
class LetterFury {
    constructor() {
        //abbreviates the native DOM selector for easier use
        this.$q = document.querySelector.bind(document);
        // holds high scores retrived from endoint
        this.HighScores = [];
        this.ListOfWords = [];
        // endoint for  retrieving high scores. TODO add to config file
        this.HighScoresEndpoint = 'https://6dmnrf7ylc.execute-api.us-east-1.amazonaws.com/default';
        //Random Word generated for game
        this.OurRandomWord = ''; // 
        //container for each chance per random number
        this.ListOfChances = [];
        //Number of times a player guesses during a turn. TODO: make this private
        this.NumberOfRounds = 0;
        // Counter for the intro (rules)
        this.IntroIndex = 1;
        // number of times a word can be skipped
        this.SkipsAllowed = 3;
        this.NumberOfSkips = 0;
        // if set to true, outputs comments about game logic to console
        this._testMode = false;
        this.CurrentPointValue = {
            MaxPointsForWord: 10,
            SecondsForPointChange: 15,
            PointsForCurrentWord: 0,
            SecondIndex: 0
        };
        // this object contains data for group games
        this.GroupGame = {
            IsGroupGame: false,
            GroupGameName: '',
            GroupUserName: ''
        };
        // number of high scores to be diplayed on list
        this.NumberOfHighScores = 10;
        // the state the game is in. Values: intro game_play, game_over, high_score
        this.GameState = 'intro';
        //Rank of player in highscores
        this.CurrentRank = 0;
        // number used for countdown timer
        this.CountdownNumber = 0;
        this.LengthOfGameInMinutes = 3;
        //these variables contain the emoji svg
        this.$happySvg = '';
        this.$closeSvg = '';
        this.$angrySvg = '';
        //this is a list of discarded letters for a round
        this.DiscardedLetters = [];
        this.IntroJson = {
            Items: this.GetIntroJsonItems(() => {
                this.ResetRandomNumber(60, 40, () => { this.$q("#terminal").innerHTML = !this.ElementIsHidden(this.$q("#rules")) ? this.OurRandomWord : ''; });
            })
        };
        // object containing different steps for countdown to start game
        this.CountdownObj = {
            Items: [
                {
                    'Console': 'Setting up Random Words...', 'Action': () => {
                        window.InitInput = window.setInterval(() => {
                            this.SetRandomWord();
                            this.$q("#gameText").value = this.OurRandomWord;
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
                        window.clearInterval(window.InitInput);
                        this.$q("#gameText").value = '';
                    }
                }
            ]
        };
    }
    GetIntroJsonItems(introFunction) {
        return [
            { 'Console': introFunction, 'Text': 'The computer has chosen a 3-letter word.', 'HTML': '' },
            { 'Console': '???', 'Text': 'You need to guess what it is.', 'HTML': '' },
            { 'Console': '  ', 'Text': 'The computer will give you am emoji with some clues. ', 'HTML': '<img src="img/happy.svg"  height="120"/><img src="img/angry.svg"  height="120"/><img src="img/close.svg"  height="120"/>' },
            { 'Console': '  ', 'Text': 'The emoji &#128577; means the letter is NOT in the word.', 'HTML': '<img src="img/angry.svg"  height="120"/>' },
            { 'Console': '  ', 'Text': 'The emoji &#128579;  means the letter is in the word, but in the wrong place.', 'HTML': '<img src="img/close.svg"  height="120"/>' },
            { 'Console': '  ', 'Text': '&#128522;  Means the letter is in the right place.', 'HTML': '<img src="img/happy.svg"  height="120"/>' },
            { 'Console': '  ', 'Text': 'Your goal is to get &#128522; &#128522; &#128522; as many times as you can in 2 minutes.', 'HTML': '<img src="img/happy.svg"  height="120"/><img src="img/happy.svg"  height="120"/><img src="img/happy.svg"  height="120"/>' },
            { 'Console': '  ', 'Text': 'Are you ready to accept the challenge?', 'HTML': '<span onclick="DalyasGame.Init();" id="clickToStart">Click to start</button>' }
        ];
    }
    // this is the function to start a new game.  Should probably be changed to GameInit
    Init() {
        if (window.IntroText) {
            window.clearInterval(window.IntroText);
        }
        if (this.ElementIsHidden(this.$q("#gameSection"))) {
            this.NavigateToGamePageStart();
        }
        //load all the svg data into variables
        this.$happySvg = this.$q("#happysvg").innerHTML;
        this.$angrySvg = this.$q("#angrysvg").innerHTML;
        this.$closeSvg = this.$q("#closesvg").innerHTML;
        this.WriteToConsole("Resetting Game...", "info");
        this.SetRandomWord();
        this.ListOfChances = [];
        this.NumberOfRounds = 0;
        this.GetTopScore();
        this.BeginAdvancedRound();
        this.FocusInputElement(true);
    }
    InitGroupGame() {
        this.GroupGame.GroupGameName = this.CreateRandomNames().toLowerCase();
        this.GroupGame.GroupUserName = this.CreateRandomNames().toLowerCase();
        this.NavigateToGroupGamePage();
        setTimeout(() => {
            this.BuildRandomNameUI("groupGameVal", this.GroupGame.GroupGameName);
            this.BuildRandomNameUI("groupUserVal", this.GroupGame.GroupUserName);
        }, 500);
    }
    GetTopScore() {
        fetch(`${this.HighScoresEndpoint}/getscores?count=1`)
            .then((result) => result.json())
            .then((data) => {
            this.$q("#highScoreCount").innerHTML = data[0].highscore;
        });
    }
    // begins changing page  to the game
    NavigateToGamePageStart() {
        this.$q("#gameSection").style.display = "block";
        this.$q("#ruleSection").style.display = "none";
        this.$q("#consoleContainer").classList.add("easeInRight");
        this.$q("#letterContainer").classList.add("easeInLeft");
        this.$q("#inputContainer").classList.add("easeInLeft");
        this.$q("#title").classList.add("easeUpTitle");
    }
    //ends changing the page  to the game (removes animation classes when it completeds )
    NavigateToGamePageEnd() {
        this.$q("#consoleContainer").classList.remove("easeInRight");
        this.$q("#letterContainer").classList.remove("easeInLeft");
        this.$q("#inputContainer").classList.remove("easeInLeft");
    }
    // changes page to home
    NavigateToHomePageStart() {
        this.$q("#consoleContainer").classList.add("easeOutRight");
        this.$q("#letterContainer").classList.add("easeOutLeft");
        this.$q("#inputContainer").classList.add("easeOutLeft");
    }
    NavigateToGroupGamePage() {
        this.$q("#gameSection").style.display = "none";
        this.$q("#ruleSection").style.display = "none";
        this.$q("#groupGameSection").style.display = "block";
        this.$q("#groupGameContainer").classList.add("easeInRight");
    }
    //removes animation classes from home navigation after completion
    NavigateToHomePageEnd() {
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
    ShowIntro() {
        const $body = this.$q("body");
        document.querySelector("#terminal").classList.remove("flattenConsole");
        this.RenderConsoleText(this.IntroJson.Items[0]);
        window.IntroText = window.setInterval(() => {
            const currentItem = this.IntroJson.Items[this.IntroIndex];
            this.RenderConsoleText(currentItem);
            this.IntroIndex = this.IntroIndex >= this.IntroJson.Items.length - 1 ? 0 : this.IntroIndex + 1;
        }, 4000);
    }
    ResetRandomNumber(delay, repetitions, elementReset) {
        var x = 0;
        var intervalID = window.setInterval(() => {
            this.SetRandomWord();
            elementReset();
            if (++x === repetitions) {
                window.clearInterval(intervalID);
                this.ClearGameText();
            }
        }, delay);
    }
    // this writes to the console on the rules page by splitting the value and writing it char by char 
    RenderConsoleText(obj) {
        const $rulesElem = this.$q("#rules");
        const $currentElem = this.$q("#terminal");
        $rulesElem.innerHTML = obj.Text;
        if (typeof (obj.Console) === 'string') {
            obj.Console.split('').forEach((item, index, arr) => {
                ((index) => {
                    window.setTimeout(() => {
                        if (index === arr.length - 1 && obj.HTML !== '' && !this.ElementIsHidden($rulesElem)) {
                            $currentElem.innerHTML = obj.HTML;
                        }
                        else if (!this.ElementIsHidden($rulesElem)) {
                            const currentText = obj.Console.substring(0, index + 1);
                            $currentElem.innerHTML = currentText;
                        }
                    }, 100 * index);
                })(index);
            });
        }
        else {
            obj.Console();
        }
    }
    SkipWord() {
        this.WriteToConsole(`The word was ${this.OurRandomWord.toLowerCase()}.Skipping..`);
        this.NumberOfSkips--;
        this.WriteToConsole(`You have ${this.NumberOfSkips} skip(s) left`);
        if (this.NumberOfSkips === 0) {
            this.$q("#skipWordLink").style.display = "none";
        }
        this.StartNextRound(true);
    }
    //runs after the a player has guessed the correct #, and lets them choose another
    StartNextRound(isSkip) {
        this.DiscardedLetters = [];
        this.SetRandomWord();
        this.ListOfChances = [];
        if (!isSkip) {
            this.WriteToConsole(`You earned ${this.CurrentPointValue.PointsForCurrentWord}`);
            this.NumberOfRounds += this.CurrentPointValue.PointsForCurrentWord;
        }
        this.WriteToConsole(`Points for word set to  ${this.CurrentPointValue.MaxPointsForWord}`);
        this.CurrentPointValue.PointsForCurrentWord = this.CurrentPointValue.MaxPointsForWord;
        this.$q("#playerScoreCount").innerHTML = this.NumberOfRounds.toString();
        this.$q("#letterText").innerHTML = '';
    }
    // animation that runs when the game ends
    InvokeConsoleScatter() {
        this.$q("#consoleText").insertBefore(this.GameOverText(), this.$q("#consoleText").firstChild);
        window.setTimeout(() => {
            document.querySelectorAll(".console-comment").forEach($elem => {
                const scatter = (Math.floor(Math.random() * 3) + 1).toString();
                const scatterClass = `scatter-console-${scatter}`;
                if ($elem.id !== undefined) {
                    console.log($elem.id);
                    $elem.classList.add(scatterClass);
                }
            });
        }, 500);
    }
    SetRandomWord() {
        const num = Math.floor(Math.random() * (this.ListOfWords.length - 1));
        this.OurRandomWord = this.ListOfWords[num];
    }
    // this writes to the main console, and high score console. it takes the text, writes char by char, and applies 
    //the class passed in (elemClass) to apply the correct colour
    WriteToConsole(text, elemClass, target, timeoutTime) {
        if (target === undefined) {
            target = "#consoleText";
        }
        if (timeoutTime === undefined) {
            timeoutTime = 10;
        }
        let id = `comment--${Math.floor(Math.random() * 10000000)}`;
        let textElem = document.createElement("div");
        textElem.id = id;
        //textElem.innerHTML = text;
        textElem.className = elemClass !== null && elemClass !== void 0 ? elemClass : '';
        textElem.classList.add("console-comment");
        const parentElem = this.$q(target);
        this.$q(target).insertBefore(textElem, parentElem.firstChild);
        var $currentElem = this.$q("#" + id);
        text.split('').forEach((item, index) => {
            (function (index) {
                window.setTimeout(() => {
                    const currentText = text.substring(0, index + 1);
                    $currentElem.innerHTML = currentText;
                }, timeoutTime * index);
            })(index);
        });
    }
    // counts down to the beginning of the game
    BeginAdvancedRound() {
        this.CountdownNumber = 0;
        this.$q("#gameText").setAttribute("disabled", true);
        // reset game score if this is not the first game
        this.NumberOfRounds = 0;
        this.NumberOfSkips = this.SkipsAllowed;
        this.$q("#playerScoreCount").innerHTML = this.NumberOfRounds.toString();
        window.Countdown = setInterval(() => {
            if (this.CountdownNumber < 3) {
                const currentCountObj = this.CountdownObj.Items[this.CountdownNumber];
                this.WriteToConsole(currentCountObj.Console, "");
                currentCountObj.Action();
                this.CountdownNumber++;
            }
            else {
                //this.CountdownNumber = 5;gg
                clearInterval(window.Countdown);
                this.$q("#timer").innerHTML = "GO!";
                this.CurrentPointValue.PointsForCurrentWord = this.CurrentPointValue.MaxPointsForWord;
                this.WriteToConsole(`Points allocated for current word: ${this.CurrentPointValue.PointsForCurrentWord}`);
                this.BeginAdvancedGame();
            }
        }, 1000);
    }
    // sets up the timer that runs the game
    BeginAdvancedGame() {
        this.GameState = 'game_play';
        this.$q("#gameText").removeAttribute("disabled");
        this.EndOfGame = new Date().getTime() + this.LengthOfGameInMinutes * 60000;
        this.FocusInputElement(false);
        this.$q("#inputInner").className = "has-cursor";
        window.GamePlay = setInterval(() => {
            const now = new Date().getTime();
            const t = this.EndOfGame - now;
            if (t <= 0) {
                this.AddLoadingIcon(this.$q("#inputContainer"), "lds-facebook");
                this.$q("#inputContainerInner").style.display = "none";
                window.clearInterval(window.GamePlay);
                this.InvokeConsoleScatter();
                window.setTimeout(() => {
                    this.$q("#consoleText").innerHTML = '';
                    this.CheckForHighScore(0);
                }, 2000);
            }
            else {
                // set point count for player
                // if th
                const decreasePointValue = this.CurrentPointValue.SecondIndex === this.CurrentPointValue.SecondsForPointChange;
                if (decreasePointValue && this.CurrentPointValue.PointsForCurrentWord > 1) {
                    this.CurrentPointValue.PointsForCurrentWord--;
                    this.CurrentPointValue.SecondIndex = 0;
                    this.WriteToConsole(`Points for current word: ${this.CurrentPointValue.PointsForCurrentWord}`, "bonus");
                }
                if (!decreasePointValue) {
                    this.CurrentPointValue.SecondIndex++;
                }
                this.SetCountdownClock(t);
            }
        }, 1000);
    }
    ClearGameText() {
        this.$q("#gameText").value = "";
    }
    InitGameOver() {
        this.GameState = 'game_over';
        this.$q("#consoleText").innerHTML = "";
        this.$q("#inputInner").classList.add("has-cursor");
        this.FocusInputElement(false);
        this.ClearGameText();
        this.ClearSvgValues();
        this.$q("#letterText").innerHTML = '';
        this.WriteToConsole(`The final word was ${this.OurRandomWord}`);
        this.WriteToConsole(`If you would like to play again, type YES into the input box.
								 To go back to the homepage and high, scores, type NO `, "info");
        this.ClearGameText();
    }
    // adds seconds if a player has gotten a bonus
    AddSecondsToTime(timeAddedInSeconds) {
        for (let i = 0; i <= timeAddedInSeconds; i++) {
            ((i) => {
                window.setTimeout(() => {
                    this.EndOfGame += 1000;
                    const t = this.EndOfGame - new Date().getTime();
                    ;
                    this.SetCountdownClock(t);
                }, 10 * i);
            })(i);
        }
    }
    SetCountdownClock(t) {
        let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = (Math.floor((t % (1000 * 60)) / 1000)).toString();
        seconds = parseInt(seconds) < 10 ? '0' + seconds : seconds;
        this.$q("#timer").innerHTML = `${minutes}:${seconds}`;
    }
    // loops through the high scores and checks if this score falls in top 10
    HasHighScore(score, highscores) {
        let hasHighScore = false;
        for (let i = 0; i < highscores.length; i++) {
            if (score > highscores[i].highscore) {
                this.CurrentRank = (i + 1);
                hasHighScore = true;
                break;
            }
        }
        if (hasHighScore === false && highscores.length < 10 && score > 0) {
            console.log(highscores.length);
            this.CurrentRank = (highscores.length + 1);
            hasHighScore = true;
        }
        return hasHighScore;
    }
    // gets current scores from db. if the player is in the highscore list, 
    //allow player to add initials. Otherwise continue to game over
    CheckForHighScore(score) {
        fetch(`${this.HighScoresEndpoint}/getscores`)
            .then((result) => result.json())
            .then((data) => {
            this.RemoveLoadingIcon(this.$q("#inputContainer"), "lds-facebook");
            this.$q("#inputContainerInner").style.display = "block";
            const hasHighScore = this.HasHighScore(this.NumberOfRounds, data);
            if (!hasHighScore) {
                this.InitGameOver();
            }
            else {
                this.GameState = 'high_score';
                document.querySelector("#inputInner").classList.add("has-cursor");
                this.FocusInputElement(false);
                //this.$q("#inputAction").innerHTML = "initials";
                this.WriteToConsole(`Congratulations! you are ranked number ${this.CurrentRank} on our list of all time champs!
													Please enter your initials`, "bonus");
            }
        });
        const higherScores = this.HighScores.filter(e => e >= score);
        return higherScores.length;
    }
    // puts focus on input element for each turn. disabled on mobile because the keyboard pops up and hides console
    FocusInputElement(allowMobileFocus) {
        if (this.IsDesktop || allowMobileFocus === true) {
            this.$q("#gameText").focus();
        }
    }
    //sends high score to db
    SetScores(initials) {
        this.AddLoadingIcon(this.$q("#inputContainer"), "lds-facebook");
        this.$q("#inputContainerInner").style.display = "none";
        fetch(`${this.HighScoresEndpoint}/logscores`, {
            mode: 'no-cors',
            method: 'post',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: initials, highscore: this.NumberOfRounds })
        }).then((res) => {
            this.RemoveLoadingIcon(this.$q("#inputContainer"), "lds-facebook");
            this.$q("#inputContainerInner").style.display = "block";
            if (res.ok) {
                this.WriteToConsole(`High score successfully added for ${initials}`, "info");
            }
            else {
                this.WriteToConsole("Sorry, could not add high score", "error");
            }
            this.InitGameOver();
        });
    }
    DisplayInputResults($gameTextElem, text, className) {
        const emojis = document.querySelectorAll(".game-emoji");
        for (const emoji of emojis) {
            emoji.classList.add("flatten-emoji");
        }
        window.setTimeout(() => {
            $gameTextElem.value = "";
            this.$q("#gameText").style.visibility = "visible";
            //this.$q("#mainBody label").style.display="block";
            this.$q("#inputInner").className = "has-cursor";
            this.WriteToConsole(text, className);
            this.$q("#gameText").focus();
        }, 1000);
    }
    //taken from https://stackoverflow.com/questions/8335834/how-can-i-hide-the-android-keyboard-using-javascript
    HideKeyboard() {
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
    }
    // gets the high scores from the db and displays them on the highscore console
    DisplayScores() {
        if (window.IntroText) {
            window.clearInterval(window.IntroText);
        }
        const $terminal = this.$q("#terminal");
        let advancedText = '';
        $terminal.innerHTML = '';
        this.AddLoadingIcon($terminal, "lds-facebook");
        fetch(`${this.HighScoresEndpoint}/getscores`)
            .then((result) => result.json())
            .then((data) => {
            this.RemoveLoadingIcon($terminal, "lds-facebook");
            this.HighScores = data;
            if (this.HighScores.length === 0) {
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
    ElementIsHidden($el) {
        return $el.offsetParent === null;
    }
    AddLoadingIcon($parent, icon) {
        let $loading = document.createElement("div");
        //textElem.innerHTML = text;
        $loading.className = icon;
        if (icon === "lds-facebook") {
            for (let i = 0; i < 3; i++) {
                let $innerElem = document.createElement("div");
                $loading.appendChild($innerElem);
            }
        }
        $parent.appendChild($loading);
    }
    RemoveLoadingIcon($parent, icon) {
        const $elem = this.$q(`.${icon}`);
        if ($elem !== null) {
            $parent.removeChild($elem);
        }
    }
    // this the primary function for guessing an item. it gets the input value
    // checks if input correct, and then processes result
    MakeSelection() {
        this.HideKeyboard();
        let $gameTextElem = this.$q("#gameText");
        const regex = /^[a-zA-Z]{3}$/;
        let gameText = $gameTextElem.value;
        if (!regex.test(gameText)) {
            this.WriteToConsole("Invalid entry", "error");
        }
        else {
            //take the number that the we made and split it into 3 piecies
            //take the number computer made and split that into 3 pieces
            //then compare the computer number against our number
            let whatIsHappening = 'The computer has word' + this.OurRandomWord + ' and we have chosen ' + gameText;
            let ourGameText = gameText.split('');
            let resultsCode = '';
            let computerGameText = this.OurRandomWord.split('');
            $gameTextElem.value = '';
            if (this.OurRandomWord.toString().toLowerCase() === gameText.toLowerCase()) {
                this.DisplayInputResults($gameTextElem, "Congrats! Code successfully unlocked. Resetting to new number", "victory");
                this.ResetRandomNumber(40, 12, () => { this.$q("#gameText").value = this.OurRandomWord; });
                if (this.ListOfChances.length < 4) {
                    this.DisplayInputResults($gameTextElem, "30 second bonus for guessing in under 4 tries", "bonus");
                    this.AddSecondsToTime(30);
                }
                else if (this.ListOfChances.length > 3 && this.ListOfChances.length < 7) {
                    this.DisplayInputResults($gameTextElem, "15 second bonus for guessing in under 7 tries", "bonus");
                    this.AddSecondsToTime(15);
                }
                this.ClearSvgValues();
                this.StartNextRound(false);
                return;
            }
            for (let i = 0; i < 3; i++) {
                //check our number against the computers number
                if (ourGameText[i].toLowerCase() === computerGameText[i].toLowerCase()) {
                    whatIsHappening += `<br/>Number ${i + 1} was right!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
                    resultsCode += '&#128522;';
                    this.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(), 'right');
                    this.$q("#resultImg-" + i).innerHTML = this.$happySvg;
                }
                else if ((ourGameText[i].toLowerCase() !== computerGameText[i].toLowerCase()) && this.OurRandomWord.toLowerCase().indexOf(ourGameText[i].toLowerCase()) !== -1) {
                    whatIsHappening += `<br/>Number ${i + 1} not totally right - it is there, but not in the same place!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
                    resultsCode += '&#128579;';
                    this.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(), 'almost');
                    this.$q("#resultImg-" + i).innerHTML = this.$closeSvg;
                }
                else {
                    whatIsHappening += `<br/>Number ${i + 1} was wrong!.  The computer chose ${computerGameText[i]} and you chose ${ourGameText[i]}<br/>`;
                    resultsCode += '&#128577;';
                    this.PushToDiscardedLetterArray(ourGameText[i].toLowerCase(), 'wrong');
                    this.$q("#resultImg-" + i).innerHTML = this.$angrySvg;
                }
            }
            resultsCode = `${resultsCode} (${gameText})`;
            this.ListOfChances.push(resultsCode);
            this.WriteDiscardedLettersToScreen();
            //$gameTextElem.value = resultsCode.split(' ')[0];
            if (this._testMode) {
                console.log(whatIsHappening);
            }
            //show the emoji results
            //this.$q("#mainBody label").style.display="none";
            this.$q("#resultsDisplay").style.display = "flex";
            this.$q("#gameText").style.visibility = "hidden";
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
    WriteDiscardedLettersToScreen() {
        const spanOpen = (exp) => `<span class="${exp} discarded-letter">`;
        const spanClose = "</span>";
        const joinVal = this.DiscardedLetters.reduce((t, c) => t + `${spanOpen(c.val)}${c.letter}${spanClose}`, '');
        this.$q("#letterText").innerHTML = joinVal;
    }
    //the hs buttom alternatives between rules and high scores, change back and forth between keypress
    ToggleHighScoreButton() {
        let $rulesElem = this.$q("#rules");
        let $terminalElem = this.$q("#terminal");
        let $button = this.$q("#highScoreButton");
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
    HandleKeyPressEvent(event) {
        if (event.target.value.length >= 3 && this.GameState === 'game_play') {
            this.MakeSelection();
        }
        else if (event.target.value.toUpperCase() === 'YES' && this.GameState === 'game_over') {
            this.Init();
        }
        else if (event.target.value.toUpperCase() === 'NO' && this.GameState === 'game_over') {
            this.NavigateToHomePageStart();
        }
        else if (event.target.value.length == 3 && this.GameState === 'high_score') {
            this.SetScores(event.target.value);
        }
    }
    // checks which css animation has completed and routes to correct fn
    HandleAnimationEnding(e) {
        switch (e.animationName) {
            case 'extend-console':
                this.DisplayScores();
                break;
            case 'ease-left':
                this.NavigateToGamePageEnd();
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
                for (const emoji of emojis) {
                    emoji.classList.add("flatten-emoji");
                }
                this.$q("#resultsDisplay").style.height = "10px";
                break;
        }
    }
    GameOverText() {
        let $elem = document.createElement("div");
        let $innerElem = document.createElement("pre");
        $elem.appendChild($innerElem);
        $elem.className = "gameOver";
        if (window.matchMedia('(min-width: 961px)').matches) {
            $innerElem.innerHTML = `	
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
        else {
            $innerElem.innerHTML = "GAME OVER";
        }
        return $elem;
    }
    PushToDiscardedLetterArray(letter, val) {
        this.DiscardedLetters = this.DiscardedLetters.filter(e => e.letter !== letter);
        this.DiscardedLetters.push({ letter, val });
    }
    CreateRandomNames() {
        const wordCount = this.ListOfWords.length - 1;
        const wordArr = [];
        for (let i = 0; i < 3; i++) {
            const rand = Math.floor(Math.random() * wordCount);
            wordArr.push(this.ListOfWords[rand]);
        }
        return wordArr.join('');
    }
    BuildRandomNameUI(id, val) {
        const that = this;
        let alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let valArr = val.split('');
        let itemFound = [];
        for (let i = 0; i < valArr.length; i++) {
            itemFound.push('');
        }
        let counter = 0;
        window.NameUI[val] = setInterval(function (counter) {
            return () => {
                if (counter === alphabet.length) {
                    window.clearInterval(window.NameUI[val]);
                }
                const currentLetter = alphabet[counter];
                console.log('Current Letter is ' + currentLetter);
                const currentWordArr = [];
                for (let i = 0; i < valArr.length; i++) {
                    if (itemFound[i] !== '') {
                        currentWordArr.push(itemFound[i]);
                    }
                    else {
                        currentWordArr.push(currentLetter);
                        if (currentLetter === valArr[i]) {
                            itemFound[i] = currentLetter;
                        }
                    }
                }
                const currentWord = currentWordArr.join('');
                console.log('Current Word is ' + currentWord);
                const $currentElem = that.$q("#" + id);
                $currentElem.innerHTML = currentWord;
                ++counter;
            };
        }(0), 50);
    }
    ClearSvgValues() {
        for (let i = 0; i < 3; i++) {
            this.$q("#resultImg-" + i).innerHTML = '';
        }
    }
    IsDesktop() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) {
            return false;
        }
        else if ((/iPad|iPhone|iPod/.test(ua))) {
            return false;
        }
        return true;
    }
}
exports.LetterFury = LetterFury;
