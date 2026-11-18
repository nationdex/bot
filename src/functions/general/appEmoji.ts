import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'appEmoji',
  // Resolves an emoji by ID, from the application emojis or from any server the bot is in (native $emoji looks in both).
  params: [
    {
      name: 'emoji',
      // The emoji ID
      type: 'String',
      required: true,
    },
    {
      name: 'value',
      // The value to get, id/name/url/emoji (default emoji)
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[q;$trim[$replace[$env[emoji];null;]]]
  $let[kind;$toLowerCase[$trim[$replace[$env[value];null;]]]]
  $if[$get[q]==;$return[]]
  $if[$emojiExists[$get[q]]==false;$return[]]
  $if[$get[kind]==id;$return[$emojiID[$get[q]]]]
  $if[$get[kind]==name;$return[$emojiName[$get[q]]]]
  $if[$get[kind]==url;$return[$emojiURL[$get[q]]]]
  $return[$emoji[$get[q]]]
  `,
});
