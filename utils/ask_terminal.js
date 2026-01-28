module.exports.ask_terminal = async function ask_terminal(message) {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(message, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}