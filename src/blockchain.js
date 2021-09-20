/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const BlockData = require('./data.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [new BlockClass.Block('Genesis Block')];
    }

    _last(array) {
        return array[array.length - 1];
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(data) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let latestBlock = await self._last(self.chain)

                let proposedBlock = new BlockClass.Block(
                    data,
                    latestBlock.hash,
                    latestBlock.height + 1
                )

                let isValid = await proposedBlock.validate() // This should be part of the constructor

                if (isValid) {
                    self.chain.push(proposedBlock)
                    let chainValidationErrors = await self.validateChain()
                    
                    if (chainValidationErrors.length === 0) {
                        resolve(proposedBlock)
                    } else {
                        self.chain.pop()
                        reject(chainValidationErrors)
                    }
                } else {
                    reject('Invalid block')
                }

            } catch (e) {
                reject(e)
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`)
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let timeFromMessage = parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));

            let isUnderFiveMinutes = ((currentTime - timeFromMessage) / 60) < 5
            let isValidMessage = await bitcoinMessage.verify(message, address, signature)
            
            if (!isUnderFiveMinutes) {
                return reject('Message is too old!')
                
            }

            if (!isValidMessage) {
                return reject('Message is not valid!')
            }

            self._addBlock(
                new BlockData(address, star)
            ).then(lastBlock => {
                resolve(lastBlock);
            }, onrejected => {
                reject(onrejected)
            })
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.find(block => block.hash === hash)

            if (block) {
                resolve(block)
            } else {
                reject('Block not found')
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let stars = [];

            for (let b of self.chain) {
                let body = await b.getBData()

                if (body && body.ownerAddress === address) {
                    stars.push(body.star)
                }
            }

            resolve(stars)
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let errorLog = [];

            var previous;
            for (let b of self.chain) {
                let isValid = await b.validate()

                if (!isValid) {
                    errorLog.push(`${b.hash} is invalid`)
                } else if (previous && previous.hash !== b.previousBlockHash) {
                    errorLog.push(`${b.hash} is incorrectly linked`)
                }

                previous = b;
            }

            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;