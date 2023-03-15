const crypto = require('crypto');
const readline = require("readline");
const AsciiTable = require('ascii-table')

class Move {
    constructor(name) {
        this.name = name;
    }

    toString() {
        return this.name;
    }

    compare(otherMove, moves) {
        const half = Math.floor(moves.length / 2);
        const index = moves.indexOf(this);
        const halfAhead = moves.slice(index + 1).concat(moves.slice(0, index));
        const halfBehind = [...halfAhead].reverse();
        const winningMoves = halfBehind.slice(0, half);
        const losingMoves = halfAhead.slice(0, half);

        if (this === otherMove) {
            return 'Draw';
        } else if (winningMoves.includes(otherMove)) {
            return 'Win';
        } else if (losingMoves.includes(otherMove)) {
            return 'Lose';
        }
    }
}


class RulesGenerator {
    constructor(moves) {
        this.moves = moves;
    }

    generateRules() {
        const rules = {};
        for (let i = 0; i < this.moves.length; i++) {
            const row = {};
            for (let j = 0; j < this.moves.length; j++) {
                row[this.moves[j]] = this.moves[i].compare(this.moves[j], this.moves);
            }
            rules[this.moves[i]] = row;
        }
        return rules;
    }
}

class TableResult {
    constructor(rules) {
        this.rules = rules;
        this.table = new AsciiTable('Rules of the game').setHeading('Moves', 'Conditions');
    }

    generateTable() {
        for (let key in this.rules) {
            let conditions = this.rules[key]
            let arr = []
            for (let key in conditions) {
                let part = [key, conditions[key]]
                arr.push(part)
            }
            this.table.addRow(key, arr.map(e => e[1] === "Win" ? ` ${e[0]}: ${e[1]} ` : ` ${e[0]}: ${e[1]}` )).setAlign(0, AsciiTable.CENTER)
        }
        return this.table.toString()
    }
}

class HMAC {
    constructor(move, key) {
        this.computerMove = move;
        this.key = key;
    }

    getHMAC() {
        const hmac = crypto.createHmac('sha256', this.key);
        hmac.update(this.computerMove.toString());
        return hmac.digest('hex');
    }
}

class Game {
    constructor(moves) {
        this.moves = moves.map((name) => new Move(name));
        this.rules = new RulesGenerator(this.moves).generateRules();
        this.table = new TableResult(this.rules).generateTable();
    }

    play() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        const key = crypto.randomBytes(32).toString('hex');
        const hmac = new HMAC(computerMove, key);


        console.log(`HMAC: ${hmac.getHMAC()}`);
        console.log('Available moves:');
        console.log(this.moves.map((move, index) => `${index + 1} - ${move}`).join('\n'));
        console.log('0 - Exit');
        console.log('? - help');

        rl.question('Enter your move: ', (input) => {
            if (input === "?") {
                console.log(this.table)
                console.log('1 - Play');
                console.log('0 - Exit');
                rl.question('Enter your choice: ', (input) => {
                    const choice = parseInt(input);
                    if (isNaN(choice) || choice < 0 || choice > 2) {
                        console.log('Invalid input. Please enter a number 1 or 0.');
                        console.log('1 - Play');
                        console.log('0 - Exit');
                        rl.close();
                        this.play();
                    } else if (choice === 1) {
                        rl.close();
                        this.play();
                    } else if (choice === 0) {
                        rl.close();
                    }
                })
            } else {
                const choice = parseInt(input);
                if (isNaN(choice) || choice < 0 || choice > this.moves.length) {
                    console.log('Invalid input. Please enter a number between 0 and ' + this.moves.length + '.');
                    this.play();
                } else if (choice === 0) {
                    rl.close();
                } else {
                    const userMove = this.moves[choice - 1];
                    const result = this.rules[userMove][computerMove];
                    console.log(`Your move: ${userMove}`);
                    console.log(`Computer move: ${computerMove}`);
                    console.log(`You have ${result}!`);
                    console.log(`HMAC key: ${hmac.key.toString('hex')}`);
                    rl.close();
                }
            }
        });
    }
}


const moves = process.argv.slice(2);
if (moves.length < 3 || moves.length % 2 === 0 || new Set(moves).size !== moves.length) {
    console.log('Invalid input. Please enter an odd number >= 3 of non-repeating moves.');
    console.log('Example: node task3.js rock paper scissors');
    process.exit();
}

const game = new Game(moves);
game.play();
