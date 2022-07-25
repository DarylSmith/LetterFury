export class LfIntro {
    GetIntroJsonItems(introFunction) {
        return [
            { 'Console': '___', 'Text': 'The goal of Letter Fury is to guess as many<br/> 3-letter words as possible in 2 minutes.', 'HTML': '' },
            { 'Console': 'PEA', 'Text': 'When the game starts, begin entering letters', 'HTML': '' },
            { 'Console': '  ', 'Text': 'The computer will respond emojis to provide clues. ', 'HTML': '<img src="img/happy.svg"  height="50"/><img src="img/angry.svg"  height="50"/><img src="img/close.svg"  height="50"/>' },
            { 'Console': '  ', 'Text': 'The frown emoji means the letter is NOT in the word. <br/>(There is no E)', 'HTML': '<img src="img/angry.svg"  height="100"/>' },
            { 'Console': '  ', 'Text': 'The upside-down emoji means the letter is in the word,<br/> but in the wrong place (There is an A)', 'HTML': '<img src="img/close.svg"  height="100"/>' },
            { 'Console': '  ', 'Text': 'The happy emoji means the letter is in the right place.', 'HTML': '<img src="img/happy.svg"  height="100"/>' },
            { 'Console': 'PAN', 'Text': 'In this case, the correct answer is PAN', 'HTML': '' },
            { 'Console': '  ', 'Text': 'You can only guess real words. Invalid words provide no clues', 'HTML': '<span class="error">EOC</span>' },
            { 'Console': '  ', 'Text': 'You can play by yourself,or against others', 'HTML': '' },
            { 'Console': introFunction, 'Text': 'Are you ready to accept the challenge?', 'HTML': '' }
        ];
    }
}
