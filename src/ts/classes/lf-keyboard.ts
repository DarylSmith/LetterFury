export class LetterFuryKeyboard{

private assignedLetters:[string,number][]=[];

private keyboardInterval:any;

private readonly letterArr:string[][]=
[['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']]

constructor(){}

public BuildKeyboard():string{

    let keyboardLines = [];
    this.letterArr.forEach((keyLine,ind)=>{

        const line=`<div class='line${ind+1}'>`;
        keyboardLines.push(keyLine.reduce<string>((prev,curr)=>
        { return prev + `<span class='lf-key-init' id='lf-lett-${curr}' click='enterLetter(${curr})'>${curr}</span>`},line));

    });

    return keyboardLines.join('</div>') +'</div>';
}

public DisplayLettersOnKeyboard(): void{

    this.assignedLetters = this.letterArr[0].concat(this.letterArr[1]).concat(this.letterArr[2])
    .map(e=> [e,Math.random()]);
    this.assignedLetters.sort((a,b)=>  a[1]-b[1]);

    this.keyboardInterval = setInterval(()=>{

        const currentLetter = this.assignedLetters.shift()[0];

        document.querySelector(`#lf-lett-${currentLetter}`).classList.remove('lf-key-init');
        document.querySelector(`#lf-lett-${currentLetter}`).classList.add('lf-key-visible');
    
        if(this.assignedLetters.length===0){
            clearInterval(this.keyboardInterval);
        }
        
    },45);
    


}

}