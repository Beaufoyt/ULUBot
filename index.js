const Discord = require('discord.io');
const https = require('https');
const config = require('./config.js');
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
            message: 'you don\'t wanna know... \n' +
                'trust me',
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

    if (message.startsWith('>reddit')) {
        let sub, url = '';
        const args = message.split(' ');
        const requestedAmount = parseInt(args[2]);
        const subreddit = args[1];
        const maxAmount = 5;

        if (!subreddit) {
            bot.sendMessage({
                to: channelID,
                message: 'Please enter a subreddit to get stuff from',
            });
        } else {
            if (args[3] && args[3] === 'top') {
                url = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=all`;
            } else {
                url = `https://www.reddit.com/r/${subreddit}/.json`;
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
                            message: 'No data found for the specified subreddit',
                        });
                        return;
                    }

                    const response = JSON.parse(body);
                    const responseNoStickies = response.data.children.filter((child) => {
                        return !child.data.stickied;
                    });

                    if (!responseNoStickies.length || responseNoStickies.length < requestedAmount) {
                        bot.sendMessage({
                            to: channelID,
                            message: 'Not enough images found for this sub',
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
