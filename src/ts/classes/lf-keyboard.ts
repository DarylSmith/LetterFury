export class LetterFuryKeyboard{

private assignedLetters:[string,number][]=[];

private keyboardInterval:any;

private readonly _letterArr:string[][]=
[['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']]

private get _singleLetterArray():string[]{
    return this._letterArr[0].concat(this._letterArr[1]).concat(this._letterArr[2]);
   }

   
constructor(){}

public BuildKeyboard():string{

    let keyboardLines = [];
    this._letterArr.forEach((keyLine,ind)=>{

        const line=`<div class='line${ind+1}'>`;
        keyboardLines.push(keyLine.reduce<string>((prev,curr)=>
        { return prev + `<span class='lf-key-init' id='lf-lett-${curr}' onclick='EnterLetter("${curr}")'>${curr}</span>`},line));

    });

    return keyboardLines.join('</div>') +'</div>';
}

public AddKeyClass(letter:string, status:string)
{
    this.RemoveAllUsedKeyClasses(letter);
    const elem: HTMLElement =  document.querySelector(`#lf-lett-${letter}`);
    elem.classList.add(`lf-key-${status}`);
}

public RemoveAllKeyClasses(){
    this._singleLetterArray.forEach((letter)=>{

        this.RemoveAllUsedKeyClasses(letter);

    })

}

public DisplayLettersOnKeyboard(): void{

    this.assignedLetters = this._singleLetterArray
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

private RemoveAllUsedKeyClasses(letter:string){

    const elem: HTMLElement =  document.querySelector(`#lf-lett-${letter}`);
    elem.classList.remove('lf-key-correct','lf-key-incorrect','lf-key-close');
        
}

}