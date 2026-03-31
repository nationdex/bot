module.exports = {
	data: {
		name: "about",
		description: "Provides information about the bot.",
	},
	// This command must be linked to the config.ts file in order to work flawlessly.
	// Please make sure to link this command in the config.ts file.
	code: `
    $addContainer[
        $addTextDisplay[## Nationdex Discord Bot]
        $addSeparator[Small]
        $addSection[
            $addTextDisplay[> Collect nations on Discord and enjoy an OG environment of peace and freedom!
            Running version 1.0.0\
            The bot has been online for 1 day, 2:34:55.
            ]
        ]
        $addSeparator
        $addSection[
            $addTextDisplay[> 100 nations to collect 848 players that caught 13,162 nations.
            380 servers playing
            ]
            $addButton[https://discord.com/application-directory/1207017704096141312;Invite;Link;;false]
        ]
    ]
    `,
};
