const Discord = require('discord.io');
const https = require('https');
const http = require('http');
const WolframLib = require('node-wolfram');

const config = require('./config.js');

const wolfram = new WolframLib(config.wolframAppId);
const resultOpts = ['Result', 'Exact result', 'Decimal approximation'];
const bot = new Discord.Client({
    token: config.token,
    autorun: true,
});

bot.on('ready', function() {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

let interval = null;

bot.on('message', (user, userID, channelID, message, event) => {

    if (!interval) {
        interval = setInterval(() => {
            bot.sendMessage({
                to: channelID,
                message: 'Andy\'s a cunt',
            });
        }, 1200000);
    }

    if (message === '>ping') {
        bot.sendMessage({
            to: channelID,
            message: 'pong',
        });
    }

    if (message === '>bugo') {
        bot.sendMessage({
            to: channelID,
            message: 'you don\'t wanna know...',
        });
    }

    if (message.substring(0, 10) === '>question ') {
        wolfram.query(message.substring(10, message.length), function(err, result) {
            if(err) {
                bot.sendMessage({
                    to: channelID,
                    message: 'Sorry, I couldn\'t process the question at this time',
                });
            } else if (result.queryresult.pod != undefined) {
                let img = '';
                const text = result.queryresult.pod[1].subpod[0].plaintext;
                const finalText = (text.toString() === '19') ? 'You stoopid' : null;

                if (result.queryresult.pod[1].subpod[0].img[0]) {
                    img = result.queryresult.pod[1].subpod[0].img[0].$.src;
                };

                bot.sendMessage({
                    to: channelID,
                    message: finalText || img,
                });
            } else {
                bot.sendMessage({
                    to: channelID,
                    message: 'I don\'t seem to have an answer to that question',
                });
            }
        });
    }

    if (message.startsWith('>8ball')) {
        const sayings = [
            'It is certain',
            'It is decidedly so',
            'Without a doubt',
            'Yes, definitely',
            'You may rely on it',
            'As I see it, yes',
            'Most likely',
            'Outlook good',
            'Yes',
            'Signs point to yes',
            'Reply hazy try again',
            'Ask again later',
            'Better not tell you now',
            'Cannot predict now',
            'Concentrate and ask again',
            'Don\'t count on it',
            'My reply is no',
            'My sources say no',
            'Outlook not so good',
            'Very doubtful',
        ];

        const result = Math.floor((Math.random() * sayings.length) + 0);
        bot.sendMessage({
            to: channelID,
            message: sayings[result],
        });
    }

    if (message.startsWith('>rate')) {
        let args = [];
        if (message.indexOf(' ') > -1) {
            args = message.split(' ');
        } else {
            args[1] = message.substring(5, message.length);
        }

        if (!args[1]) {
            bot.sendMessage({
                to: channelID,
                message: 'Please enter a user to rate out of 10',
            });
        } else {
            bot.sendMessage({
                to: channelID,
                message: `${args[1]  } is a ${   Math.floor(Math.random() * 10) + 1  } out of 10`,
            });
        }
    }

    if (message.startsWith('>numberfact')) {
        http.get('http://numbersapi.com/random', function(res){
            let body = '';

            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){
                bot.sendMessage({
                    to: channelID,
                    message: body,
                });
            });
        }).on('error', function(e){
            console.log('Got an error: ', e);
        });
    }

    if (message.startsWith('>reddit')) {
        let url = '';
        const args = message.split(' ');
        const sub = args[1];
        const requestedAmount = parseInt(args[2]);
        const maxAmount = 5;

        if (!sub) {
            bot.sendMessage({
                to: channelID,
                message: 'Please enter a sub to get posts from',
            });
        } else {
            if (args[3] && args[3] === 'top') {
                url = `https://www.reddit.com/r/${sub}/top/.json?sort=top&t=all`;
            } else {
                url = `https://www.reddit.com/r/${sub}/.json`;
            }

            https.get(url, function(res){
                let body = '';

                res.on('data', function(chunk){
                    body += chunk;
                });

                res.on('end', function(){
                    if (body.indexOf('302 Found') > -1) {
                        bot.sendMessage({
                            to: channelID,
                            message: `No posts found for /r/${sub}`,
                        });
                        return;
                    }

                    const response = JSON.parse(body);

                    if (!response.data || !response.data.children || !response.data.children.length) {
                        bot.sendMessage({
                            to: channelID,
                            message: `No posts found for /r/${sub}`,
                        });
                        return;
                    }

                    const responseNoStickies = response.data.children.filter((child) => {
                        return !child.data.stickied;
                    });

                    if (!responseNoStickies.length || responseNoStickies.length < requestedAmount) {
                        bot.sendMessage({
                            to: channelID,
                            message: `Not enough posts found for /r/${sub}`,
                        });
                        return;
                    }

                    const amount = requestedAmount ? ((requestedAmount < maxAmount) ? requestedAmount : maxAmount) : 1;

                    for (let i=0; i<amount; i++) {
                        const { data } = responseNoStickies[i];

                        bot.sendMessage({
                            to: channelID,
                            message: `**${data.title}**\n` +
                                `comments: <http://reddit.com${data.permalink}>\n` +
                                `link: ${data.url.replace(new RegExp('&amp;', 'g'), '&')}\n` +
                                '========================================================',
                        });
                    }
                });
            }).on('error', function(e){
                console.log('Got an error: ', e);
            });
        }
    }
});
