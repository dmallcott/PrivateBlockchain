Hey there reviewer. Hope all is well.

I've chosen to do two things "off-script" from the rubric.

1. hex2ascii was giving a lot of trouble with extended ASCII charactes. In short, it can't seem to decode `°` correctly. Comes out as `Â°`. So I've decided to use `Buffer.from` since we're already using it to encode the data.
2. I've deleted the `height` field in the Blockchain class. Personally I prefer relying on `chain.length` instead of remembering to keep the counter up-to-date. 

Other than that I think I've done my best at following instructions. It all seems to work. I've left a test suite using jest so you should be able to asses most test cases I could think off. Please don't judge my JS too much. First time coding in JS. Very strange experience. 