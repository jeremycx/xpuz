const _ = require('lodash');
const util = require('node:util');

const HORIZONTAL = 0;
const VERTICAL = 1;

class Word {
    constructor(score, word, x, y, direction) {
        this.score = score;
        this.word = word;
        this.x = x;
        this.y = y;
        this.direction = direction;
    }

    toString() {
        let msg;

        msg =   "word:  " + this.word +  "\n";
        msg +=  "score: " + this.score + "\n";
        msg +=  "x:     " + this.x +     "\n";
        msg +=  "y:     " + this.y +     "\n";
        msg +=  "dir:   " + (this.direction == 0 ? "ACROSS" : "DOWN") + "\n";
        return msg;
    }

    toShortString(listsize_fyi) {
        return `${this.word}${this.direction == "HORIZONTAL" ? "-" : "|"}(${this.x},${this.y})[${this.score},${listsize_fyi}]->`;
    }

}

class Gameboard {
    gameboard = [];

    constructor(width, height, wordlist, gameboard, answerkey) {
       if (width instanceof Gameboard) {
            this.clone(width);
        } else {
            this.width = width;
            this.height = height;
            this.creategameboard(width, height);
            this.answerkey = "";
            this.wordlist = wordlist.sort((a,b) => {
                return b.length - a.length;
            });
        }

        this.myword = this.wordlist.shift();
        if (this.wordlist.length == 0) {
            return this;
        }
        console.log(this.answerkey);

        let res;

        res = this.place(this.myword);

        if (res === undefined) {
            return undefined;
        }
        return res;
    }

    creategameboard(width, height) {
        let g = [];
        for (let y = 0; y < this.height ; y++) {
            g.push([]);
            for (let x = 0 ; x < this.width ; x++) {
                g[y].push("-");
            }
        }
        this.gameboard = g;
    }

    clone(obj) {
        this.answerkey = obj.answerkey;
        this.gameboard = _.cloneDeep(obj.gameboard);
        this.height = obj.height;
        this.width = obj.width;
        this.wordlist = _.cloneDeep(obj.wordlist);
    }


    /*
      "place" creates a list of candidate placements.
      we need to sort them by score (desc) and then
      iterate through thte list, recursing into Gameboard
      constructor until either we
        * find a place (in which case we instantiate and try from there
        * we get to the end of the candidate list (or there are no candidates at all)
          and in this case we thraow an error, and pop stack until we
          get to an instace where there a re remaining candidates.
    */

    checkfit_h(word) {
        // for a horizontal match, all positions must not:
        // - land on a non-matching letter,
        // - run off the board

        let gb = this.gameboard;
        let candidates = [];
        let score;

        checkrow: for (let y = 0 ; y < this.height ; y++) {
            checkcolumn: for (let x = 0 ; x < this.width ; x++) {
                score = 0;
                // check the word against pos y, x
                if (x + word.length >= this.width) {
                    continue checkrow;
                }
                for (let c = 0 ; c < word.length ; c++) {
                    if (gb[y][x+c] == "-") {
                        continue;
                    }
                    if (gb[y][x+c] == word[c]) {
                        score++;
                        continue;
                    }
                    // we didn't *continue* so, we hit a blocker
                    // proceed to next x position
                    continue checkcolumn;
                }
                // we got to the end of the word! It's a candidate!
                candidates.push(new Word(score, word, x, y, HORIZONTAL));
            }
        }
        return candidates;
    }

    checkfit_v(word) {
        // for a vertical match, all positions must not:
        // - land on a non-matching letter,
        // - run off the board

        let gb = this.gameboard;
        let candidates = [];
        let score = 0;

        checkrow: for (let y = 0 ; y < this.height ; y++) {
            checkcolumn: for (let x = 0 ; x < this.width ; x++) {
                // check the word against pos y, x
                if (y + word.length >= this.height) { // won't fit in the grid
                    continue checkrow;
                }
                for (let c = 0 ; c < word.length ; c++) {
                    if (gb[y+c][x] == "-") {
                        continue;
                    }
                    if (gb[y+c][x] == word[c]) {
                        score++;
                        continue;
                    }
                    // we didn't *continue* so, we hit a blocker
                    // proceed to next x position
                    continue checkcolumn;
                }
                // we got to the end of the word! It's a candidate!
                candidates.push(new Word(score, word, x, y, VERTICAL));
            }
        }
        return candidates;
    }


    place(word) {
        let candidates = [];

        candidates = this.checkfit_h(word);
        candidates = _.concat(candidates, this.checkfit_v(word));

        if (candidates.length == 0) {
            return undefined;
        }

        // TODO: shuffle here to induce randomness in sorting
        //       for words with identical scores
        //       as we're going to walk the list trying all the
        //       candidates in reverse score until one doesn't
        //       fail downstream
        candidates = _.shuffle(candidates).sort((a,b) => {
            return b.score - a.score;
        });

        for (let x = 0 ; x < candidates.length ; x++) {
            let provisionalThis = _.cloneDeep(this);

            provisionalThis.insertWord(candidates[x]);
            provisionalThis.answerkey = (provisionalThis.answerkey += candidates[x].toShortString(candidates.length));

            let res = new Gameboard(provisionalThis);

            if (res !== undefined) {
                return res;
            }
        }

        return undefined;
    }


    insertWord(candidate) {
        if (candidate.direction == HORIZONTAL) {
            for (let c = 0 ; c < candidate.word.length ; c++) {
                this.gameboard[candidate.y][candidate.x + c] = candidate.word[c];
            }
        } else {
            for (let c = 0 ; c < candidate.word.length ; c++) {
                this.gameboard[candidate.y + c][candidate.x] = candidate.word[c];
            }
        }
    }

    show() {
        let row = "" + util.inspect(this.answerkey);

        row += "\nWords: " + this.answerkey.length + "\n  ";

        for (let x = 0 ; x < this.width ; x++) {
            row = row + x + " ";
        }
        row = row + "\n";

        for (let y = 0 ; y < this.height ; y++) {
            row += y + " ";
            for (let x = 0 ; x < this.width ; x++) {
                row = row + this.gameboard[y][x] + " ";
            }
            row = row + "\n";
        }
        console.log(row);
    }
}


// -------------------- Test Section ---------------------

let x = new Gameboard(10, 10, [
    "one",
    "two",
    "three",
    // get four from fourteen
    "five",
    // six
    // seven
    //eight
    //nine
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "oclock"
]);
