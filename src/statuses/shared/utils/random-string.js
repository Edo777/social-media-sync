const _numbers = "0123456789";
const _upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const _lower = "abcdefghijklmnopqrstuvwxyz";
const _symbols = "`~!@#$%^&*()_+<>/\\?[]{}=-*,.;':\"";

function generate(length, chars = "ulns", excludeChars = "") {
    let characters = "";

    if (chars.includes("n")) {
        characters += _numbers;
    }

    if (chars.includes("l")) {
        characters += _lower;
    }

    if (chars.includes("u")) {
        characters += _upper;
    }

    if (chars.includes("s")) {
        characters += _symbols;
    }

    excludeChars.split("").forEach((char) => {
        const pattern = new RegExp(char, "g");
        characters = characters.replace(pattern, "");
    });

    let result = "";
    const charactersLength = characters.length;

    // Take random characters and create the random string
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = generate;
