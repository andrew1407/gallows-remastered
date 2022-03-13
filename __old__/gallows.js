`use strict`;

const readline = require("readline"), extra = require(`./extra`); 
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.clear();
const gallows = () => {
    rl.question(
        `Difficulty:
        \n1) я у мамы телепат (1 try);
        \n2) у меня бабка гадалка в десятом колене (7 tries);
        \n3) я алфавит во втором классе учил (13 tries);
        \n4) мозга нет (overmnogo tries);
        \n(Put '++' to add gamemode 'Unlock one letter only'): `, 
        (dif) => { 
            console.clear(); 
            try {
                dif = dif.trim().split(``);
                let d = dif[0];
                plus = dif[1] + dif[2];    
                const w = extra.secret_word();
                let c2 = w.length, c3 = 0;
                let c1 = (d === `1`)? 1: 
                    (d === `2`) ? 7 : 
                    (d === `3`) ? 13 : 
                    (d === `4`) ? 11819615: 
                    gallows();
                const ending = c1;
                let cc1 = (d === `4`) ? 10 : c1;
                let arr = w
                    .split(``)
                    .map(() => `| ? | `); 
                const vis = (c1 === 7) ? extra.seven :
                    (c1 === 13) ? extra.fifteen :
                    (c1 === 1) ? extra.one :
                    extra.zero;
                let line = 
                    `${arr.join(` `)}\n\v${vis(c3)}\n\vTries:${cc1}\n\vletter: `;
                let arr2 = w.split(``); 
                const game = () => {
                    rl.question(line,(answer) => {
                        answer = answer.trim();
                        console.clear();                
                        if(arr2.includes(answer.toLowerCase()) || arr2.includes(answer.toUpperCase())) {
                            if(c2 !== 1) {
                	            for(let i = 0; i < arr.length; i++) {
                                    if(arr2[i].toUpperCase() === answer || 
                                     arr2[i].toLowerCase() === answer) {
                                        arr[i] = `| ${w[i]} | `;
                                        arr2[i]=`⚡`; 
                                        c2--;
                                        if(plus === `++`) break;
                                    };
                	            };
                                line = `${arr.join(` `)}\n\v${vis(c3)}\n\vTries:${cc1}\n\vletter: `;
                                game();
                            } else {
                                    console.log(`${w.split(``).map(x=>`| ${x} | `).join(` `)}\n\v${vis(c3)}\n\vTries:${cc1}\n\vletter: `);
                                    setTimeout(() => {
                                        console.clear();
                                        extra.win();
                                    }, 2000);
                                };
                        } else {
                            if(c1 !== 1) {
                                c1--;
                                line = `${arr.join(` `)}\n\v${vis(++c3)}\n\vTries:${--cc1}\n\vletter: `;
                                game();
                            } else {
                                extra.lose(ending);
                                if(ending !== 11819615) setTimeout(extra.textlose, 5000);
                                else rl.close(); 
                            };
                        };             
                    })
                };
                if(d === `4`) {
                    extra.away();
                    setTimeout(game, 10500);
                } else game();
            } catch(e) {
                gallows.call();
            };
        }
    )
};

gallows.call();
