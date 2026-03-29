module.exports = {
	data: {
		name: "about",
		description: "Provides information about the bot.",
	},
	code: `
    $addContainer[
        $addTextDisplay[## {config.name} Discord Bot]
        $addSeparator[Small]
        $addSection[
            $addTextDisplay[> Collect countryballs on Discord, exchange them and battle with friends!
            Running version 3.0.2\
            The bot has been online for 1 day, 2:34:55.
            ]
        ]
        $addSeparator
        $addSection[
            $addTextDisplay[> 358 countryballs to collect 1,375,236 players that caught 102,704,144 countryballs.
            444,840 servers playing
            ]
            $addButton[https://discord.com/oauth2/authorize?client_id=999736048596816014&scope=bot+applications.commands&permissions=537185280;Invite;Link;;false]
        ]
    ]
    `,
};
