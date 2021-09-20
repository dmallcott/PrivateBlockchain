const { Block } = require('../src/block')
const  BlockData = require('../src/data')
const { Blockchain } = require('../src/blockchain')
const bitcoinMessage = require('bitcoinjs-message');

jest.mock('bitcoinjs-message');

const myStar = {
    "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "Testing the story 4"
    }
};

test('block chain is valid and not empty', () => {
    let genesis = new Blockchain().chain[0]

    expect(genesis.height).toEqual(0);
    expect(genesis.previousBlockHash).toEqual('');
});

test('block chain adds second block successfully', () => {
    let blockchain = new Blockchain()

    blockchain._addBlock('Second block').then(() => {
        expect(blockchain.chain.length).toEqual(2)
        expect(blockchain.chain[1].previousBlockHash).toBeDefined()
        expect(blockchain.chain[1].height).toEqual(1)
        expect(blockchain.chain[1].previousBlockHash).toEqual(blockchain.chain[0].hash)
    });

});

test('test ownership works', () => {
    expect(new Blockchain().requestMessageOwnershipVerification('tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr')).resolves.toEqual(
        expect.stringContaining('tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr')
    )
});

test('test submitStar works', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let myMessage = await blockchain.requestMessageOwnershipVerification(myWallet)
    let mySignature = 'Wohooo'
    
    let expected = new BlockData(myWallet, myStar)
    bitcoinMessage.verify.mockResolvedValue(true)

    blockchain.submitStar(myWallet, myMessage, mySignature, myStar).then(addedBlock => {
        expect(addedBlock.getBData()).resolves.toEqual(expected)
    })
});

test('test submitStar fails when message does not verify', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let myMessage = await blockchain.requestMessageOwnershipVerification(myWallet)
    let mySignature = 'Wohooo'
    let expected = new BlockData(myWallet, myStar)
    bitcoinMessage.verify.mockResolvedValue(false)

    blockchain.submitStar(myWallet, myMessage, mySignature, myStar).then(
        onsuccess => {throw new Exception('This should not have happened')}, 
        error => { expect(error).toEqual('Message is not valid!') }
    )
});

test('test submitStar fails when message is older than 5 minutes', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let oldTime = parseInt(new Date().getTime().toString().slice(0, -3)) - 60 * 5
    let myMessage = `${myWallet}:${oldTime}:starRegistry`
    let mySignature = 'Wohooo'
    bitcoinMessage.verify.mockResolvedValue(true)

    blockchain.submitStar(myWallet, myMessage, mySignature, myStar).then(
        onsuccess => {throw Exception('This should not have happened')}, 
        error => { expect(error).toEqual('Message is too old!') })
});

test('getBlockByHash returns block when present', () => {
    let blockchain = new Blockchain()
    let genesisBlock = blockchain.chain[0]
    blockchain._addBlock('Whatever')

    expect(blockchain.getBlockByHash(genesisBlock.hash)).resolves.toEqual(genesisBlock)
});

test('getBlockByHash fails when block is not present', () => {
    let blockchain = new Blockchain()
    let randomBlock = new Block('Lalala')
    blockchain._addBlock('Whatever')

    expect(blockchain.getBlockByHash(randomBlock.hash)).rejects.toEqual('Block not found')
});

test('test submitStar works', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let otherWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tabctsd7cr'
    let myMessage = await blockchain.requestMessageOwnershipVerification(myWallet)
    let otherMessage = await blockchain.requestMessageOwnershipVerification(otherWallet)
    let mySignature = 'Wohooo'
    
    bitcoinMessage.verify.mockResolvedValue(true)

    await blockchain.submitStar(myWallet, myMessage, mySignature, myStar)
    await blockchain.submitStar(otherWallet, otherMessage, mySignature, myStar) // Ironically, this shouldn't be possible

    blockchain.getStarsByWalletAddress(myWallet).then(starArray => {
        expect(starArray.length).toEqual(1)
    })
});

test('valid chain is valid', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let otherWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tabctsd7cr'
    let myMessage = await blockchain.requestMessageOwnershipVerification(myWallet)
    let otherMessage = await blockchain.requestMessageOwnershipVerification(otherWallet)
    let mySignature = 'Wohooo'
    
    bitcoinMessage.verify.mockResolvedValue(true)

    await blockchain.submitStar(myWallet, myMessage, mySignature, myStar)
    await blockchain.submitStar(otherWallet, otherMessage, mySignature, myStar) 

    blockchain.validateChain().then(result => {
        expect(result.length).toEqual(0)
    })
});

test('invalid chain breaks', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let otherWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tabctsd7cr'
    let myMessage = await blockchain.requestMessageOwnershipVerification(myWallet)
    let otherMessage = await blockchain.requestMessageOwnershipVerification(otherWallet)
    let mySignature = 'Wohooo'
    
    bitcoinMessage.verify.mockResolvedValue(true)

    await blockchain.submitStar(myWallet, myMessage, mySignature, myStar)
    await blockchain.submitStar(otherWallet, otherMessage, mySignature, myStar) 

    blockchain.chain[0].data = Buffer.from(JSON.stringify("I'm a hacker")).toString('hex')

    blockchain.validateChain().then(result => {
        expect(result.length).toEqual(1)
        expect(result[0]).toContain('is invalid')
    })
});

test('invalid chain breaks when adding new blocks', async () => {
    let blockchain = new Blockchain()
    let myWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tkaftsd7cr'
    let otherWallet = 'tb1qkr3ykj0gafg807a3dawyamxa94f6tabctsd7cr'
    let myMessage = await blockchain.requestMessageOwnershipVerification(myWallet)
    let otherMessage = await blockchain.requestMessageOwnershipVerification(otherWallet)
    let mySignature = 'Wohooo'
    
    bitcoinMessage.verify.mockResolvedValue(true)

    await blockchain.submitStar(myWallet, myMessage, mySignature, myStar)
    await blockchain.submitStar(otherWallet, otherMessage, mySignature, myStar) 

    blockchain.chain[0].data = Buffer.from(JSON.stringify("I'm a hacker")).toString('hex')

    expect(blockchain._addBlock('This should fail')).rejects.toEqual([`${blockchain.chain[0].hash} is invalid`]).catch(e => console.log(e))
});

test('broken chain breaks', async () => {
    let blockchain = new Blockchain()
    blockchain.chain.push(new Block('LALALA'))

    blockchain.validateChain().then(result => {
        expect(result.length).toEqual(1)
        expect(result[0]).toContain('is incorrectly linked')
    })
});