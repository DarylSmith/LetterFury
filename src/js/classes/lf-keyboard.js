export class LetterFuryKeyboard {
    constructor() {
        this.assignedLetters = [];
        this._letterArr = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'p']];
    }
    get _singleLetterArray() {
        return this._letterArr[0].concat(this._letterArr[1]).concat(this._letterArr[2]);
    }
    BuildKeyboard() {
        let keyboardLines = [];
        this._letterArr.forEach((keyLine, ind) => {
            const line = `<div class='line${ind + 1}'>`;
            keyboardLines.push(keyLine.reduce((prev, curr) => { return prev + `<span class='lf-key-init' id='lf-lett-${curr}' onclick='EnterLetter("${curr}")'>${curr}</span>`; }, line));
        });
        // add the back button at the end
        keyboardLines[keyboardLines.length - 1] += `<span class='lf-key-init' id='lf-back' onclick='RemoveLetter()'><img src='/img/back.svg'/></span>`;
        return keyboardLines.join('</div>') + '</div>';
    }
    AddKeyClass(letter, status) {
        this.RemoveAllUsedKeyClasses(letter);
        const elem = document.querySelector(`#lf-lett-${letter}`);
        elem.classList.add(`lf-key-${status}`);
    }
    RemoveAllKeyClasses() {
        this._singleLetterArray.forEach((letter) => {
            this.RemoveAllUsedKeyClasses(letter);
        });
    }
    DisplayLettersOnKeyboard() {
        this.assignedLetters = this._singleLetterArray
            .map(e => [e, Math.random()]);
        this.assignedLetters.sort((a, b) => a[1] - b[1]);
        this.keyboardInterval = setInterval(() => {
            const currentLetter = this.assignedLetters.shift()[0];
            document.querySelector(`#lf-lett-${currentLetter}`).classList.remove('lf-key-init');
            document.querySelector(`#lf-lett-${currentLetter}`).classList.add('lf-key-visible');
            if (this.assignedLetters.length === 0) {
                document.querySelector(`#lf-back`).classList.remove('lf-key-init');
                document.querySelector(`#lf-back`).classList.add('lf-key-visible');
                clearInterval(this.keyboardInterval);
            }
        }, 45);
    }
    RemoveAllUsedKeyClasses(letter) {
        const elem = document.querySelector(`#lf-lett-${letter}`);
        elem.classList.remove('lf-key-correct', 'lf-key-incorrect', 'lf-key-close');
    }
}
