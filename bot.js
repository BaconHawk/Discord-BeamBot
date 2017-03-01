const Discord = require('discord.js');
const request = require('request');
const sql = require('sqlite');
sql.open('./streamers.sqlite');
let Config;

//look for config
try {
    Config = require('./config.json');
} catch(e) {
    console.log('Please create an config.json file in the main directory based off of the config.json.example file!\n' + e.stack);
	process.exit();
}

console.log('I am ready for work :)')

const bot = new Discord.Client()

function check() {
    for(let i = 0; Config.streamers.length > i; i++) {
         sql.get(`SELECT * FROM streamers WHERE streamer ='${Config.streamers[i]}'`).then(row => {
            if (!row) {
                sql.run('INSERT INTO streamers (streamer, status) VALUES (?, ?)', [Config.streamers[i], 0]);
             } else {
                 request('https://beam.pro/api/v1/channels/'+Config.streamers[i],
                    function(err,res,body){
                        const data = JSON.parse(body);
                        if(!data) console.log(`The channel, ${Config.streamers[i]}, is not a valid beam.pro channel!`);
                        if(data.online === false && row.status === 0) console.log(`${row.streamer} is already saved as offline!`);
                        if(data.online === false && row.status == 1) {
                            sql.run(`UPDATE streamers SET status = 0 WHERE streamer = '${Config.streamers[i]}'`);
                            console.log(`${Config.streamers[i]} is offline!`)
                        };
                        if(row.status === 1 && data.online == true) return;
                        if(data.online === true && row.status == 0) {
                            sql.run(`UPDATE streamers SET status = 1 WHERE streamer = '${Config.streamers[i]}'`);
                            console.log(`${row.streamer} is now Online!`)
                            for(let j = 0; j < Config.channelID.length; j++){
                                const embed = new Discord.RichEmbed()
                                    .setTitle('Beam Alerts')
                                    .setDescription(`${Config.streamers[i]} is now live!`)
                                    .addField(`Playing For:`, `${data.numFollowers} followers`,true)
                                    .addField(`${Config.streamers[i]} is Playing:`, `${data.type.name}`,true)
                                    .setFooter('BaconHawk - NITEHAWK')
                                    .setColor([0,45,255])
                                    .setTimestamp()
                                bot.channels.get(Config.channelID[j]).sendEmbed(embed);
                            }
                        }
                    });
    }    
}).catch(() => {
    console.error;
    sql.run('CREATE TABLE IF NOT EXISTS streamers (streamer TEXT, status INTEGER)').then(() => {
      sql.run('INSERT INTO streamers (streamer, status) VALUES (?, ?)', [Config.streamers[i], 0]);
      console.log(`Table created!`);
    });
  });
    }

}

bot.on('ready', () =>{check(); setInterval(check, 60*5*1000)});
bot.login(Config.bot_token)