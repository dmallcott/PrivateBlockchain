const { Block } = require('../src/block');
const BlockData = require('../src/data');

const blockContent = new BlockData(
    'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr', 
    { "star": { "dec": "68° 52' 56.9", "ra": "16h 29m 1.0s", "story": "Testing the story 4" } }
);

test('Decoding works', () => {
    let block = new Block(
        blockContent
    )

    return expect(Block.decodeData(block.data)).toEqual(blockContent);
});

test('Copying a block works', () => {
    let untamperedBlock = new Block(blockContent)

    return expect(untamperedBlock.validate()).resolves.toEqual(true);
});

test('tampering with a block leads to different hash', () => {
    let originalBlock = new Block(
        blockContent
    )

    originalBlock.data = Buffer.from(JSON.stringify('The hacker is here')).toString('hex')

    return expect(originalBlock.validate()).resolves.toEqual(false);
});

test('getBData not valid for genesis block', () => {
    let originalBlock = new Block(
        blockContent
    )

    return expect(originalBlock.getBData()).resolves.toBeUndefined();
});

test('getBData not valid for tampered block', () => {
    let originalBlock = new Block(
        data = 'Hello world',
        previousBlockHash = '1234567890'
    )

    originalBlock.data = Buffer.from(JSON.stringify("I'm a hacker")).toString('hex')

    return expect(originalBlock.getBData()).rejects.toEqual('Invalid block');
});


test('getBData is valid', () => {
    let originalBlock = new Block(
        data = 'Hello world',
        previousBlockHash = '1234567890'
    )

    return expect(originalBlock.getBData()).resolves.toEqual('Hello world');
});
