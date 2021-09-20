const hex2ascii = require('hex2ascii')
const { Block } = require('../src/block')


const myStar = {
    "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "Testing the story 4"
    }
};

test('hex2ascii works as expected', () => {
    expect(Block.decodeData(Block.encodeData(myStar))).toEqual(myStar);
});
