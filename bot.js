function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}
const Discord = require('discord.js');

const auth = require('./auth.json');

// Initialize Discord Bot
const client = new Discord.Client();

client.once('ready', () => {
    console.log('Logged in as: ' + client.user.username + ' - (' + client.user.id + ')');
});

client.login(auth.token);

client.on('message', msg => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    var message = msg.content;
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var guild = msg.guild;

        args = args.splice(1);
        if (msg.channel.type === 'text') {
            switch(cmd) {
                case 'invite':
                    if (args.length < 1) {
                        msg.channel.send('Der Befehl lädt einen Benutzer, oder eine Gruppe in diese Kategorie ein, bzw. entfernt deren Berechtigung wieder');
                        msg.channel.send('Der Befehl hat die Form `!invite (remove) @<Nutzer>`, wobei bei eingabe des `@` eine Liste aller Benutzer und Gruppen aufploppen sollte');
                    } else {
                        var user_or_role = msg.mentions.roles.first();

                        if (user_or_role == null) {
                            user_or_role = msg.mentions.users.first();
                        }

                        if (user_or_role == null) {
                            msg.channel.send('Bitte gib einen Benutzer oder eine Rolle mit einem sog. "Mention" an, also mit einem @ vor seinem Namen');
                        } else {
                            if (args[0] === 'remove') {
                                if (args.length < 2) {
                                    msg.channel.send('Zu wenige Parameter! Bitte gib einen Benutzer oder eine Rolle mit einem sog. "Mention" an, also mit einem @ vor seinem Namen');
                                } else {
                                    msg.channel.parent.overwritePermissions(user_or_role, {
                                        VIEW_CHANNEL: false,
                                        SEND_MESSAGES: false,
                                        CONNECT: false,
                                        SPEAK: false,
                                    });
                                    reply.channel.send('_' + args[1] + ' wurde aus dieser Kategorie entfernt_');
                                }
                            } else {
                                msg.channel.parent.overwritePermissions(user_or_role, {
                                    VIEW_CHANNEL: true,
                                    SEND_MESSAGES: true,
                                    CONNECT: true,
                                    SPEAK: true,
                                    USE_VAD: true,
                                    MANAGE_CHANNELS: false,
                                    MANAGE_MESSAGES: false,
                                });
                                reply.channel.send('_' + args[1] + ' wurde dieser Kategorie hinzugefügt_');
                            }
                        }
                    }
                    break;
                case 'topic':
                    if (args.length < 2) {
                        //msg.channel.send('Der Befehl hat die Form `!topic [open|close|reopen|delete] <Name>`, bzw. `!topic rename <Name> <Neuer Name>`');
                        msg.channel.send('Gib `!topic [open|close|reopen|rename|delte] help` ein um Hilfe zu einem spezifischen Befehl zu bekommen');
                    } else if (args[0] === 'open') {
                        if (args[1] === 'help') {
                            msg.channel.send('Dieser Befehl öffnet einen neuen Textkanal für das angegebene Thema.');
                            msg.channel.send('Der Befehl hat die Form `!topic open <Name>` wobei `<Name>` den neuen Textkanalnamen beschreibt.');
                            msg.channel.send('Bitte beachte, dass Discord aktuell für Textkanalnamen nur Kleinbuchstaben, ohne Leerzeichen zulässt.');
                        } else {
                            var name = args[1];

                            var channel = msg.channel.parent.children.find(channel => channel.name === name);

                            if (channel != null) {
                                console.log('**Diesen Kanal gibt es bereits.** Bitte wähle einen anderen Namen, oder benutze `!topic rename <Alter Name> <Neuer Name>` um den Kanal umzubenennen');
                            } else {
                                console.log(channel);

                                guild.createChannel(name, {
                                    type: 'text',
                                    parent: msg.channel.parent,
                                }).then(channel => {
                                    console.log('Channel ' + name + ' created');
                                    channel.lockPermissions().catch(console.error);
                                }).catch(console.error);
                            }
                        }
                    } else if (args[0] === 'close') {
                        if (args[1] === 'help') {
                            msg.channel.send('Dieser Befehl schließt den Textkanal für das angegebene Thema. Damit kann zwar jeder noch den gesamten Nachrichtenverlauf lesen, aber niemand mehr etwas schreiben.');
                            msg.channel.send('Der Befehl hat die Form `!topic close <Name>` wobei `<Name>` den Textkanalnamen beschreibt.');
                            msg.channel.send('Bitte beachte, dass Discord aktuell für Textkanalnamen nur Kleinbuchstaben, ohne Leerzeichen zulässt.');
                        } else {
                            var name = args[1];

                            var channel = msg.channel.parent.children.find(channel => channel.name === name);

                            if (channel.parentID != msg.channel.parentID) {
                                msg.channel.send('Konnte den genannten Kanal in dieser Kategorie nicht finden');
                            } else {
                                msg.channel.send('**Das Thema ' + name + ' wirklich schließen?** Das Thema wird nur noch read-only sein ... **(y/n)**:');

                                const collector = new Discord.MessageCollector(msg.channel, m => m.author.id === msg.author.id, { max: 10, maxMatches: 1 });

                                collector.on('collect', reply => {
                                    if (reply.content === "y") {
                                        channel.send('**Dieses Thema wurde geschlossen!** Um es wieder zu öffnen, gib `!topic reopen <Name>` ein');

                                        var permissionsToOverwrite = arrayUnique(channel.permissionOverwrites.keyArray().concat(channel.parent.permissionOverwrites.keyArray()));

                                        permissionsToOverwrite.forEach(function(entry) {
                                            channel.overwritePermissions(entry, {
                                                SEND_MESSAGES: false
                                            }).catch(console.error);
                                        });

                                        console.log('User closed channel ' + name);
                                        if (channel != msg.channel) {
                                            msg.channel.send('_Thema wurde geschlossen_');
                                        }
                                    } else {
                                        reply.channel.send("_Vorgang abgebrochen_");
                                    }
                                })
                            }
                        }
                    } else if (args[0] === 'reopen') {
                        if (args[1] === 'help') {
                            msg.channel.send('Dieser Befehl öffnet den Textkanal für das angegebene Thema wieder, nachdem dieser geschlossen war. Damit kann jeder jeder mit entsprechender Berechtigung wieder in diesen Kanal schreiben');
                            msg.channel.send('Der Befehl hat die Form `!topic reopen <Name>` wobei `<Name>` den Textkanalnamen beschreibt.');
                            msg.channel.send('Bitte beachte, dass Discord aktuell für Textkanalnamen nur Kleinbuchstaben, ohne Leerzeichen zulässt.');
                        } else {
                            var name = args[1];

                            var channel = msg.channel.parent.children.find(channel => channel.name === name);

                            if (channel.parentID != msg.channel.parentID) {
                                msg.channel.send('Konnte den genannten Kanal in dieser Kategorie nicht finden');
                            } else {
                                var permissionsToOverwrite = arrayUnique(channel.permissionOverwrites.keyArray().concat(channel.parent.permissionOverwrites.keyArray()));

                                permissionsToOverwrite.forEach(function(entry) {
                                    channel.overwritePermissions(entry, {
                                        SEND_MESSAGES: null
                                    }).catch(console.error);
                                });

                                console.log('User reopened channel ' + name);
                                channel.send('**Dieses Thema wurde wieder eröffnet!** Um es wieder zu schließen, gib `!topic close <Name>` ein');
                                if (channel != msg.channel) {
                                    msg.channel.send('_Thema wurde wieder eröffnet_');
                                }
                            }
                        }
                    } else if (args[0] === 'rename') {
                        if (args[1] === 'help') {
                            msg.channel.send('Dieser Befehl benennt einen vorhandenen Kanal um');
                            msg.channel.send('Der Befehl hat die Form `!topic rename <Alter Name> <Neuer Name>`');
                            msg.channel.send('Bitte beachte, dass Discord aktuell für Textkanalnamen nur Kleinbuchstaben, ohne Leerzeichen zulässt.');
                        } else {
                            if (args.length < 2) {
                                msg.channel.send('Du hast zu wenige Parameter übergeben. Mit `!topic rename help` kannst du dir die richtige Syntax anzeigen lassen');
                            } else {
                                var name = args[1];
                                var newName = args[2];

                                var channel = msg.channel.parent.children.find(channel => channel.name === name);
                                var newChannel = msg.channel.parent.children.find(channel => channel.name === newName);

                                if (channel == null) {
                                    msg.channel.send('Konnte den Kanal in dieser Kategorie nicht finden');
                                } else if (newChannel != null) {
                                    msg.channel.send('Diesen Kanal gibt es bereits in dieser Kategorie. Bitte wähle einen anderen Namen.');
                                } else {
                                    channel.edit({name: newName}).then(console.log('User renamed channel ' + name + ' to ' + newName)).catch(console.log);
                                }
                            }
                        }
                    } else if (args[0] === 'delete') {
                        if (args[1] === 'help') {
                            msg.channel.send('Dieser Befehl löscht einen Textkanal für das angegebene Thema komplett und unwiederbringlich. Diesen Befehl bitte **nur mit äußerster Vorsicht** verwenden, wenn z.B. ein Thema versehentlich eröffnet wurde.');
                            msg.channel.send('Der Befehl hat die Form `!topic delete <Name>` wobei `<Name>` den Textkanalnamen beschreibt.');
                            msg.channel.send('Bitte beachte, dass Discord aktuell für Textkanalnamen nur Kleinbuchstaben, ohne Leerzeichen zulässt.');
                        } else {
                            var name = args[1];

                            var channel = msg.channel.parent.children.find(channel => channel.name === name);

                            if (channel.parentID != msg.channel.parentID) {
                                msg.channel.send('Konnte den genannten Kanal in dieser Kategorie nicht finden');
                            } else {
                                msg.channel.send('**Das Thema ' + name + ' wirklich löschen?** Dieser Vorgang kann nicht rückgängig gemacht werden! **(y/n)**:');

                                const collector = new Discord.MessageCollector(msg.channel, m => m.author.id === msg.author.id, { time: 10000 });

                                collector.on('collect', reply => {
                                    if (reply.content === "y") {
                                        if (channel != msg.channel) {
                                            msg.channel.send('_Thema wurde gelöscht_');
                                        }

                                        channel.delete().catch(console.error);

                                        console.log('User deleted channel ' + name);
                                    } else if (reply.content === "n") {
                                        reply.channel.send("_Vorgang abgebrochen_");
                                    }
                                })
                            }
                        }
                    }
                    break;
            }
        }
    }
});
