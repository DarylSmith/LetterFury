export class IntroJson{

    constructor(){

        this.Items=[];

    }
    Items:IntroJsonItem[];
}


export interface IntroJsonItem{

 Console:string|Function;
 Text:string;
 HTML:string;
}






