exports.userCommand = function(src, command, commandData, tar) {
    // loop indices
    var i, x;
    // temp array
    var ar;
    if (command == "commands" || command == "command") {
        if (commandData === undefined) {
            sendChanMessage(src, "*** Commands ***");
            for (x = 0; x < commands.user.length; ++x) {
                sendChanMessage(src, commands.user[x]);
            }
            sendChanMessage(src, "*** Other Commands ***");
            sendChanMessage(src, "/commands channel: To know of channel commands");
            if (sys.auth(src) > 0) {
                sendChanMessage(src, "/commands mod: To know of moderator commands");
            }
            if (sys.auth(src) > 1) {
                sendChanMessage(src, "/commands admin: To know of admin commands");
            }
            if (sys.auth(src) > 2 || isSuperAdmin(src)) {
                sendChanMessage(src, "/commands owner: To know of owner commands");
            }
            var pluginhelps = getplugins("help-string");
            for (var module in pluginhelps) {
                if (pluginhelps.hasOwnProperty(module)) {
                    var help = typeof pluginhelps[module] == "string" ? [pluginhelps[module]] : pluginhelps[module];
                    for (i = 0; i < help.length; ++i)
                        sendChanMessage(src, "/commands " + help[i]);
                }
            }
            /* Commenting out since no Shanai
             sendChanMessage(src, "");
             sendChanMessage(src, "Commands starting with \"\\\" will be forwarded to Shanai if she's online.");
             sendChanMessage(src, ""); */
            return;
        }

        commandData = commandData.toLowerCase();
        if ( (commandData == "mod" && sys.auth(src) > 0)
            || (commandData == "admin" && sys.auth(src) > 1)
            || (commandData == "owner" && (sys.auth(src) > 2  || isSuperAdmin(src)))
            || (commandData == "channel") ) {
            sendChanMessage(src, "*** " + commandData.toUpperCase() + " Commands ***");
            commands[commandData].forEach(function(help) {
                sendChanMessage(src, help);
            });
        }
        callplugins("onHelp", src, commandData, channel);

        return;
    }
    if ((command == "me" || command == "rainbow") && !SESSION.channels(channel).muteall) {
        if (SESSION.channels(channel).meoff === true) {
            bots.normal.sendChanMessage(src, "/me was turned off.");
            return;
        }
        if (commandData === undefined)
            return;
        if (channel == sys.channelId("Trivia") && SESSION.channels(channel).triviaon) {
            sys.sendMessage(src, "±Trivia: Answer using \\a, /me not allowed now.", channel);
            return;
        }
        if (usingBannedWords() || repeatingOneself() || capsName()) {
            sys.stopEvent();
            return;
        }
        if (SESSION.users(src).smute.active) {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active && sys.isInChannel(src, channel)) {
                    var colour = script.getColor(src);
                    sys.sendHtmlMessage(id, "<font color='"+colour+"'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + commandData + "</font>", channel);
                }
            });
            sys.stopEvent();
            script.afterChatMessage(src, '/'+command+ ' '+commandData,channel);
            return;
        }
        SESSION.channels(channel).beforeMessage(src, "/me " + commandData);
        commandData=utilities.html_escape(commandData);
        var messagetosend = commandData;
        if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW === true) {
            var date = new Date();
            if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
                messagetosend = messagetosend.toUpperCase();
            }
        }
        if (command == "me") {
            var colour = script.getColor(src);
            sendChanHtmlAll("<font color='" + colour + "'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + messagetosend + "</font>", channel);
        }
        else if (command == "rainbow" && SESSION.global().allowRainbow && channel !== 0 && channel !== tourchannel && channel !== mafiachan && channel != sys.channelId("Trivia")) {
            var auth = 1 <= sys.auth(src) && sys.auth(src) <= 3;
            var colours = ["#F85888", "#F08030", "#F8D030", "#78C850", "#98D8D8", "#A890F0", "#C183C1"];
            var colour = sys.rand(0, colours.length);
            var randColour = function () {
                var returnVal = colours[colour];
                colour = colour + 1;
                if (colour === colours.length) {
                    colour = 0;
                }
                return returnVal;
            };
            var toSend = ["<timestamp/><b>"];
            if (auth) toSend.push("<span style='color:" + randColour() + "'>+</span><i>");
            var name = sys.name(src);
            for (var j = 0; j < name.length; ++j)
                toSend.push("<span style='color:" + randColour() + "'>" + utilities.html_escape(name[j]) + "</span>");
            toSend.push("<span style='color:" + randColour() + "'>:</b></span> ");
            if (auth) toSend.push("</i>");
            toSend.push(messagetosend);
            sendChanHtmlAll(toSend.join(""), channel);
        }
        script.afterChatMessage(src, '/' + command + ' ' + commandData, channel);
        return;
    }
    if (command == "contributors") {
        sendChanMessage(src, "");
        sendChanMessage(src, "*** CONTRIBUTORS ***");
        sendChanMessage(src, "");
        for (var x in contributors.hash) {
            if (contributors.hash.hasOwnProperty(x)) {
                sendChanMessage(src, x + "'s contributions: " + contributors.get(x));
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "league") {
        if (!Config.League) return;
        sendChanMessage(src, "");
        sendChanMessage(src, "*** Pokemon Online League ***");
        sendChanMessage(src, "");
        ar = Config.League;
        for (x = 0; x < ar.length; ++x) {
            if (ar[x].length > 0) {
                sys.sendHtmlMessage(src, "<span style='font-weight: bold'>" + utilities.html_escape(ar[x][0]) + "</span> - " + ar[x][1].format(utilities.html_escape(ar[x][0])) + " " + (sys.id(ar[x][0]) !== undefined ? "<span style='color: green'>(online)</span>" : "<span style='color: red'>(offline)</span>"), channel);
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "rules") {
        if (commandData === "mafia") {
            require('mafia.js').showRules(src, commandData, channel);
            return;
        }
        var norules = (rules.length-1)/2; //formula for getting the right amount of rules
        if(commandData !== undefined && !isNaN(commandData) && commandData >0 && commandData < norules){
            var num = parseInt(commandData, 10);
            num = (2*num)+1; //gets the right rule from the list since it isn't simply y=x it's y=2x+1
            sendChanMessage(src, rules[num]);
            sendChanMessage(src, rules[num+1]);
            return;
        }
        for (var rule = 0; rule < rules.length; rule++) {
            sendChanMessage(src, rules[rule]);
        }
        return;
    }
    if (command == "players") {
        if (commandData) {
            commandData = commandData.toLowerCase();
        }
        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var android = 0;
            sys.playerIds().forEach(function (id) {
                if (sys.os(id) === commandData) {
                    android += 1;
                }
            });
            bots.count.sendMessage(src, "There are  " + android + " " + commandData + " players online", channel);
            return;
        }
        bots.count.sendChanMessage(src, "There are " + sys.numPlayers() + " players online.");
        return;
    }
    if (command == "ranking") {
        var announceTier = function(tier) {
            var rank = sys.ranking(sys.name(src), tier);
            if (rank === undefined) {
                bots.ranking.sendChanMessage(src, "You are not ranked in " + tier + " yet!");
            } else {
                bots.ranking.sendChanMessage(src, "Your rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ladderRating(src, tier) + " points / " + sys.ratedBattles(sys.name(src), tier) +" battles]!");
            }
        };
        if (commandData !== undefined) {
            if (sys.totalPlayersByTier(commandData) === 0)
                bots.ranking.sendChanMessage(src, commandData + " is not even a tier.");
            else
                announceTier(commandData);
        } else {
            [0,1,2,3,4,5].slice(0, sys.teamCount(src))
                .map(function(i) { return sys.tier(src, i); })
                .filter(function(tier) { return tier !== undefined; })
                .sort()
                .filter(function(tier, index, array) { return tier !== array[index-1]; })
                .forEach(announceTier);
        }
        return;
    }
    if (command == "battlecount") {
        if (!commandData || commandData.indexOf(":") == -1) {
            bots.ranking.sendChanMessage(src, "Usage: /battlecount name:tier");
            return;
        }
        var stuff = commandData.split(":");
        var name = stuff[0];
        var tier = stuff[1];
        var rank = sys.ranking(name, tier);
        if (rank === undefined) {
            bots.ranking.sendChanMessage(src, "They are not ranked in " + tier + " yet!");
        } else {
            bots.ranking.sendChanMessage(src, name + "'s rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ratedBattles(name, tier) +" battles]!");
        }
        return;
    }
    if (command == "auth") {
        var DoNotShowIfOffline = ["loseyourself", "oneballjay"];
        var filterByAuth = function(level) { return function(name) { return sys.dbAuth(name) == level; }; };
        var printOnlineOffline = function(name) {
            if (sys.id(name) === undefined) {
                if (DoNotShowIfOffline.indexOf(name) == -1) sys.sendMessage(src, name + " (Offline)", channel);
            } else {
                sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + name.toCorrectCase() + ' (Online)</font>', channel);
            }
        };
        var authlist = sys.dbAuths().sort();
        sendChanMessage(src, "");
        switch (commandData) {
            case "owners":
                sys.sendMessage(src, "*** Owners ***", channel);
                authlist.filter(filterByAuth(3)).forEach(printOnlineOffline);
                break;
            case "admins":
            case "administrators":
                sys.sendMessage(src, "*** Administrators ***", channel);
                authlist.filter(filterByAuth(2)).forEach(printOnlineOffline);
                break;
            case "mods":
            case "moderators":
                sys.sendMessage(src, "*** Moderators ***", channel);
                authlist.filter(filterByAuth(1)).forEach(printOnlineOffline);
                break;
            default:
                sys.sendMessage(src, "*** Owners ***", channel);
                authlist.filter(filterByAuth(3)).forEach(printOnlineOffline);
                sys.sendMessage(src, '', channel);
                sys.sendMessage(src, "*** Administrators ***", channel);
                authlist.filter(filterByAuth(2)).forEach(printOnlineOffline);
                sys.sendMessage(src, '', channel);
                sys.sendMessage(src, "*** Moderators ***", channel);
                authlist.filter(filterByAuth(1)).forEach(printOnlineOffline);
        }
        sys.sendMessage(src, '', channel);
        return;
    }
    if (command == "sametier") {
        if (commandData == "on") {
            bots.battle.sendChanMessage(src, "You enforce same tier in your battles.");
            SESSION.users(src).sametier = true;
        } else if (commandData == "off") {
            bots.battle.sendChanMessage(src, "You allow different tiers in your battles.");
            SESSION.users(src).sametier = false;
        } else {
            bots.battle.sendChanMessage(src, "Currently: " + (SESSION.users(src).sametier ? "enforcing same tier" : "allow different tiers") + ". Use /sametier on/off to change it!");
        }
        saveKey("forceSameTier", src, SESSION.users(src).sametier * 1);
        return;
    }
    if (command == "idle") {
        if (commandData == "on") {
            bots.battle.sendChanMessage(src, "You are now idling.");
            saveKey("autoIdle", src, 1);
            sys.changeAway(src, true);
        } else if (commandData == "off") {
            bots.battle.sendChanMessage(src, "You are back and ready for battles!");
            saveKey("autoIdle", src, 0);
            sys.changeAway(src, false);
        } else {
            bots.battle.sendChanMessage(src, "You are currently " + (sys.away(src) ? "idling" : "here and ready to battle") + ". Use /idle on/off to change it.");
        }
        return;
    }
    if (command == "selfkick" || command == "sk") {
        var src_ip = sys.ip(src);
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if ((src != current_player) && (src_ip == sys.ip(current_player))) {
                sys.kick(current_player);
                bots.normal.sendMessage(src, "Your ghost was kicked...");
            }
        }
        return;
    }
    if (command == "topic") {
        SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "topicadd") {
        if (SESSION.channels(channel).topic.length > 0)
            SESSION.channels(channel).setTopic(src, SESSION.channels(channel).topic + Config.topic_delimiter + commandData);
        else
            SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "removepart") {
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        if (isNaN(commandData) || commandData > topic.length) {
            return;
        }
        var part = commandData;
        if (part > 0) {
            part = part -1;
        }
        topic.splice(part, 1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command == "updatepart") {
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        var pos = commandData.indexOf(" ");
        if (pos === -1) {
            return;
        }
        if (isNaN(commandData.substring(0, pos)) || commandData.substring(0, pos) - 1 < 0 || commandData.substring(0, pos) - 1 > topic.length - 1) {
            return;
        }
        topic[commandData.substring(0, pos) - 1] = commandData.substr(pos+1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command == "uptime") {
        if (typeof(script.startUpTime()) != "string") {
            bots.count.sendChanMessage(src, "Somehow the server uptime is messed up...");
            return;
        }
        bots.count.sendChanMessage(src, "Server uptime is "+script.startUpTime());
        return;
    }
    if (command == "resetpass") {
        if (!sys.dbRegistered(sys.name(src))) {
            bots.normal.sendChanMessage(src, "You are not registered!");
            return;
        }
        sys.clearPass(sys.name(src));
        bots.normal.sendChanMessage(src, "Your password was cleared!");
        sys.sendNetworkCommand(src, 14); // make the register button active again
        return;
    }
    if (command == "importable") {
        var teamNumber = 0;
        var bind_channel = channel;
        if (!isNaN(commandData) && commandData >= 0 && commandData < sys.teamCount(src)) {
            teamNumber = commandData;
        }
        var name = sys.name(src) + '\'s ' + sys.tier(src, teamNumber) + ' team';
        var team = script.importable(src, teamNumber, true).join("\n");
        var post = {};
        post['api_option'] = 'paste'; // paste, duh
        post['api_dev_key'] = pastebin_api_key; // Developer's personal key, set in the beginning
        //post['api_user_key'] = pastebin_user_key; // Pastes are marked to our account
        post['api_paste_private'] = 1; // private
        post['api_paste_name'] = name; // name
        post['api_paste_code'] = team; // text itself
        post['api_paste_expire_date'] = '1M'; // expires in 1 month
        sys.webCall('http://pastebin.com/api/api_post.php', function (resp) {
            if (/^http:\/\//.test(resp))
                bots.normal.sendMessage(src, "Your team is available at: " + resp, bind_channel); // success
            else {
                bots.normal.sendMessage(src, "Sorry, unexpected error: " + resp, bind_channel); // an error occured
                bots.normal.sendAll("" + sys.name(src) + "'s /importable failed: " + resp, staffchannel); // message to indigo
            }
        }, post);
        return;
    }
    if (command == "cjoin") {
        var chan;
        if (sys.existChannel(commandData)) {
            chan = sys.channelId(commandData);
        } else {
            chan = sys.createChannel(commandData);
        }
        if (sys.isInChannel(src, chan)) {
            bots.normal.sendChanMessage(src, "You are already on #" + commandData);
        } else {
            sys.putInChannel(src, chan);
        }
        return;
    }

    if (command == "register") {
        if (!sys.dbRegistered(sys.name(src))) {
            bots.channel.sendChanMessage(src, "You need to register on the server before registering a channel to yourself for security reasons!");
            return;
        }
        if (sys.auth(src) < 1 && script.isOfficialChan(channel)) {
            bots.channel.sendChanMessage(src, "You don't have sufficient authority to register this channel!");
            return;
        }
        if (SESSION.channels(channel).register(sys.name(src))) {
            bots.channel.sendChanMessage(src, "You registered this channel successfully. Take a look of /commands channel");
        } else {
            bots.channel.sendChanMessage(src, "This channel is already registered!");
        }
        return;
    }
    if (command == "cauth") {
        if (typeof SESSION.channels(channel).operators != 'object')
            SESSION.channels(channel).operators = [];
        if (typeof SESSION.channels(channel).admins != 'object')
            SESSION.channels(channel).admins = [];
        if (typeof SESSION.channels(channel).masters != 'object')
            SESSION.channels(channel).masters = [];
        if (typeof SESSION.channels(channel).members != 'object')
            SESSION.channels(channel).members = [];
        bots.channel.sendChanMessage(src, "The channel members of " + sys.channel(channel) + " are:");
        bots.channel.sendChanMessage(src, "Owners: " + SESSION.channels(channel).masters.join(", "));
        bots.channel.sendChanMessage(src, "Admins: " + SESSION.channels(channel).admins.join(", "));
        bots.channel.sendChanMessage(src, "Mods: " + SESSION.channels(channel).operators.join(", "));
        if (SESSION.channels(channel).inviteonly >= 1 || SESSION.channels(channel).members.length >= 1) {
            bots.channel.sendChanMessage(src, "Members: " + SESSION.channels(channel).members.join(", "));
        }
        return;
    }
    // Tour alerts
    if(command == "touralerts") {
        if(commandData == "on"){
            SESSION.users(src).tiers = getKey("touralerts", src).split("*");
            bots.normal.sendChanMessage(src, "You have turned tour alerts on!");
            saveKey("touralertson", src, "true");
            return;
        }
        if(commandData == "off") {
            delete SESSION.users(src).tiers;
            bots.normal.sendChanMessage(src, "You have turned tour alerts off!");
            saveKey("touralertson", src, "false");
            return;
        }
        if(typeof(SESSION.users(src).tiers) == "undefined" || SESSION.users(src).tiers.length === 0){
            bots.normal.sendChanMessage(src, "You currently have no alerts activated");
            return;
        }
        bots.normal.sendChanMessage(src, "You currently get alerted for the tiers:");
        var spl = SESSION.users(src).tiers;
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                bots.normal.sendChanMessage(src, spl[x]);
            }
        }
        sendChanMessage(src, "");
        return;
    }

    if(command == "addtouralert") {
        var tier = utilities.find_tier(commandData);
        if (tier === null) {
            bots.normal.sendChanMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.");
            return;
        }
        if (typeof SESSION.users(src).tiers == "undefined") {
            SESSION.users(src).tiers = [];
        }
        if (typeof SESSION.users(src).tiers == "string") {
            SESSION.users(src).tiers = SESSION.users(src).tiers.split("*");
        }
        SESSION.users(src).tiers.push(tier);
        saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        bots.normal.sendChanMessage(src, "Added a tour alert for the tier: " + tier + "!");
        return;
    }
    if(command == "removetouralert") {
        if(typeof SESSION.users(src).tiers == "undefined" || SESSION.users(src).tiers.length === 0){
            bots.normal.sendChanMessage(src, "You currently have no alerts.");
            return;
        }
        var tier = utilities.find_tier(commandData);
        if (tier === null) {
            bots.normal.sendChanMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.");
            return;
        }
        var idx = -1;
        while ((idx = SESSION.users(src).tiers.indexOf(tier)) != -1) {
            SESSION.users(src).tiers.splice(idx, 1);
        }
        saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        bots.normal.sendChanMessage(src, "Removed a tour alert for the tier: " + tier + "!");
        return;
    }
    // The Stupid Coin Game
    if (command == "coin" || command == "flip") {
        bots.coin.sendChanMessage(src, "You flipped a coin. It's " + (Math.random() < 0.5 ? "Tails" : "Heads") + "!");
        if (!isNonNegative(SESSION.users(src).coins))
            SESSION.users(src).coins = 0;
        SESSION.users(src).coins++;
        return;
    }
    if (command == "throw") {
        if (channel != sys.channelId("Coins")) {
            bots.coin.sendChanMessage(src, "No throwing here!");
            return;
        }
        if (sys.auth(src) === 0 && SESSION.channels(channel).muteall && !SESSION.channels(channel).isChannelOperator(src)) {
            if (SESSION.channels(channel).muteallmessages) {
                sendChanMessage(src, SESSION.channels(channel).muteallmessage);
            } else {
                bots.coin.sendChanMessage(src, "Respect the minutes of silence!");
            }
            return;
        }

        if (!isNonNegative(SESSION.users(src).coins) || SESSION.users(src).coins < 1) {
            bots.coin.sendChanMessage(src, "Need more coins? Use /flip!");
            return;
        }
        if (tar === undefined) {
            if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins = 0;
            bots.coin.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at the wall!");
            SESSION.global().coins += SESSION.users(src).coins;
        } else if (tar == src) {
            bots.coin.sendChanMessage(src, "No way...");
            return;
        } else {
            bots.coin.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at " + sys.name(tar) + "!");
            if (!isNonNegative(SESSION.users(tar).coins)) SESSION.users(tar).coins = 0;
            SESSION.users(tar).coins += SESSION.users(src).coins;
        }
        SESSION.users(src).coins = 0;
        return;
    }
    if (command == "casino") {
        var bet = parseInt(commandData, 10);
        if (isNaN(bet)) {
            bots.coin.sendChanMessage(src, "Use it like /casino [coinamount]!");
            return;
        }
        if (bet < 5) {
            bots.coin.sendChanMessage(src, "Mininum bet 5 coins!");
            return;
        }
        if (bet > SESSION.users(src).coins) {
            bots.coin.sendChanMessage(src, "You don't have enough coins!");
            return;
        }
        bots.coin.sendChanMessage(src, "You inserted the coins into the Fruit game!");
        SESSION.users(src).coins -= bet;
        var res = Math.random();

        if (res < 0.8) {
            bots.coin.sendChanMessage(src, "Sucks! You lost " + bet + " coins!");
            return;
        }
        if (res < 0.88) {
            bots.coin.sendChanMessage(src, "You doubled the fun! You got " + 2*bet + " coins!");
            SESSION.users(src).coins += 2*bet;
            return;
        }
        if (res < 0.93) {
            bots.coin.sendChanMessage(src, "Gratz! Tripled! You got " + 3*bet + " coins ");
            SESSION.users(src).coins += 3*bet;
            return;
        }
        if (res < 0.964) {
            bots.coin.sendChanMessage(src, "Woah! " + 5*bet + " coins GET!");
            SESSION.users(src).coins += 5*bet;
            return;
        }
        if (res < 0.989) {
            bots.coin.sendChanMessage(src, "NICE job! " + 10*bet + " coins acquired!");
            SESSION.users(src).coins += 10*bet;
            return;
        }
        if (res < 0.999) {
            bots.coin.sendChanMessage(src, "AWESOME LUCK DUDE! " + 20*bet + " coins are yours!");
            SESSION.users(src).coins += 20*bet;
            return;
        } else {
            bots.coin.sendChanMessage(src, "YOU HAVE BEATEN THE CASINO! " + 50*bet + " coins are yours!");
            SESSION.users(src).coins += 50*bet;
            return;
        }
    }
    if (command == "myalts") {
        var ip = sys.ip(src);
        var alts = [];
        sys.aliases(ip).forEach(function (alias) {
            if (sys.dbRegistered(alias)) {
                alts.push(alias + " (Registered) ")
            }
            else {
                alts.push(alias)
            };
        })
        bot.sendChanMessage(src, "Your alts are: " + alts);
        return;
    }
    if (command == "seen") {
        if (commandData === undefined) {
            bots.query.sendChanMessage(src, "Please provide a username.");
            return;
        }
        var lastLogin = sys.dbLastOn(commandData);
        if(lastLogin === undefined){
            bots.query.sendChanMessage(src, "No such user.");
            return;
        }
        if(sys.id(commandData)!== undefined){
            bots.query.sendChanMessage(src, commandData + " is currently online!");
            return;
        }
        var indx = lastLogin.indexOf("T");
        var date,time;
        if (indx !== -1) {
            date = lastLogin.substr(0, indx);
            time = lastLogin.substr(indx + 1);
        } else {
            date = lastLogin;
        }
        var d;
        if (time) {
            var date = date.split("-");
            var time = time.split(":");
            d = new Date(parseInt(date[0], 10), parseInt(date[1], 10)-1, parseInt(date[2], 10), parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10));
        } else {
            var parts = date.split("-");
            d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10)-1, parseInt(parts[2], 10));
        }
        bots.query.sendChanMessage(src, commandData + " was last seen: "+ d.toUTCString());
        return;
    }
    if (command == "dwreleased") {
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            bots.normal.sendChanMessage(src, "No such pokemon!"); return;
        }
        var pokename = sys.pokemon(poke);
        if (dwCheck(poke) === false){
            bots.normal.sendChanMessage(src, pokename + ": has no DW ability!");
            return;
        }
        if (poke in dwpokemons) {
            if (breedingpokemons.indexOf(poke) == -1) {
                bots.normal.sendChanMessage(src, pokename + ": Released fully!");
            } else {
                bots.normal.sendChanMessage(src, pokename + ": Released as a Male only, can't have egg moves or previous generation moves!");
            }
        } else {
            bots.normal.sendChanMessage(src, pokename + ": Not released, only usable on Dream World tiers!");
        }
        return;
    }
    if (command === "pokemon") {
        var pokeId = sys.pokeNum(commandData);
        if (!pokeId) {
            bots.normal.sendMessage(src, commandData + " is not a valid Pokémon!", channel);
            return;
        }
        var type1 = sys.type(sys.pokeType1(pokeId));
        var type2 = sys.type(sys.pokeType2(pokeId));
        var ability1 = sys.ability(sys.pokeAbility(pokeId, 0));
        var ability2 = sys.ability(sys.pokeAbility(pokeId, 1));
        var ability3 = sys.ability(sys.pokeAbility(pokeId, 2));
        var baseStats = sys.pokeBaseStats(pokeId);
        var stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var levels = [5, 50, 100];
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.pokemon(pokeId) + "</font></b>", channel);
        sys.sendHtmlMessage(src, "<img src='pokemon:num=" + pokeId + "'><img src='pokemon:num=" + pokeId + "&shiny=true'>", channel);
        sys.sendHtmlMessage(src, "<b>Type:</b> " + type1 + (type2 === "???" ? "" : "/" + type2), channel);
        sys.sendHtmlMessage(src, "<b>Abilities:</b> " + ability1 + (ability2 === "(No Ability)" ? "" : ", " + ability2) + (ability3 === "(No Ability)" ? "" : ", " + ability3 + " (Dream World)"), channel);
        sys.sendHtmlMessage(src, "<b>Height:</b> " + getHeight(pokeId) + " m", channel);
        sys.sendHtmlMessage(src, "<b>Weight:</b> " + getWeight(pokeId) + " kg", channel);
        sys.sendHtmlMessage(src, "<b>Base Power of Low Kick/Grass Knot:</b> " + weightPower(getWeight(pokeId)), channel);
        var table = "<table border = 1 cellpadding = 3>";
        table += "<tr><th rowspan = 2 valign = middle><font size = 5>Stats</font></th><th rowspan = 2 valign = middle>Base</th><th colspan = 3>Level 5</th><th colspan = 3>Level 50</th><th colspan = 3>Level 100</th></tr>";
        table += "<tr><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th>";
        for (var x = 0; x < stats.length; x++) {
            var baseStat = baseStats[x];
            table += "<tr><td valign = middle><b>" + stats[x] + "</b></td><td><center><font size = 4>" + baseStat + "</font></center></td>";
            for (var i = 0; i < levels.length; i++) {
                if (x == 0) {
                    table += "<td valign = middle><center>" + calcHP(baseStat, 31, 0, levels[i]) + "</center></td><td valign = middle><center>" + calcHP(baseStat, 31, 252, levels[i]) + "</center></td><td valign = middle><center>-</center></td>";
                }
                else {
                    table += "<td valign = middle><center>" + calcStat(baseStat, 31, 0, levels[i], 1) + "</center></td><td valign = middle><center>" + calcStat(baseStat, 31, 252, levels[i], 1) + "</center></td><td valign = middle><center>" + calcStat(baseStat, 31, 252, levels[i], 1.1) + "</center></td>";
                }
            }
            table += "</tr>";
        }
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "wiki"){
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            bots.normal.sendChanMessage(src, "No such pokemon!");
            return;
        }
        var pokename = sys.pokemon(poke);
        bots.normal.sendChanMessage(src, pokename+"'s wikipage is here: http://wiki.pokemon-online.eu/wiki/"+pokename);
        return;
    }
    if (-crc32(command, crc32(sys.name(src))) == 22 || command == "wall") {
        if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins=0;
        if (!isNonNegative(SESSION.users(src).coins)) SESSION.users(src).coins=1;
        if (SESSION.global().coins < 100) return;
        bots.coin.sendChanAll("" + sys.name(src) + " found " + SESSION.global().coins + " coins besides the wall!");
        SESSION.users(src).coins += SESSION.global().coins;
        SESSION.global().coins = 0;
        return;
    }
    if(command == "shades"){
        if(sys.name(src).toLowerCase() !== "pokemonnerd"){
            return;
        }
        sys.changeName(src, "(⌐■_■)");
        return;
    }
    if (command == "changetier") {
        commandData = commandData.split(":");
        var tier = utilities.find_tier(commandData[0]);
        var team = 0;
        if (commandData[1] && commandData[1] < sys.teamCount(src) -1) {
            team = commandData[1];
        }
        if (tier && tier_checker.has_legal_team_for_tier(src, team, tier)) {
            sys.changeTier(src, team, tier);
            bots.normal.sendMessage(src, "You switched to " + tier, channel);
            return;
        }
        bots.normal.sendMessage(src, "You cannot switch to " + tier, channel);
        return;
    }
    return "no command";
};

exports.user =
[
    "/rules [x]: Shows the rules (x is optionally parameter to show a specific rule)",
    "/ranking: Shows your ranking in your current tier.",
    "/myalts: Lists your alts.",
    "/me [message]: Sends a message with *** before your name.",
    "/selfkick: Kicks all other accounts with IP.",
    //"/importable: Posts an importable of your team to pastebin.",
    "/dwreleased [Pokemon]: Shows the released status of a Pokemon's Dream World Ability",
    "/wiki [Pokémon]: Shows that Pokémon's wiki page",
    "/pokemon [Pokémon]: Shows basic information for that Pokémon",
    "/register: Registers a channel with you as owner.",
    "/resetpass: Clears your password (unregisters you, remember to reregister).",
    "/auth [owners/admins/mods]: Lists auth of given level, shows all auth if left blank.",
    "/cauth: Lists all users with channel auth in the current channel.",
    "/contributors: Lists contributors.",
    "/league: Lists gym leaders and elite four of the PO league.",
    "/uptime: Shows time since the server was last offline.",
    "/players: Shows the number of players online.",
    "/sameTier [on/off]: Turn on/off auto-rejection of challenges from players in a different tier from you.",
    "/seen [name]: Allows you to see the last login of a user.",
    "/changetier [tier]:[team]: Allows you to switch tier. Team is a number between 0-5 indicating loaded teams. Default is 0"
];