import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionEditFields } from '../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionFeatureFields',
  // Validates the feature/bug modal inputs. Returns {"fields","error"}; error is a message or empty.
  params: [
    {
      name: 'title',
      // The submitted title.
      type: 'String',
      required: true,
    },
    {
      name: 'description',
      // The submitted description.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[title;$env[title]]
  $let[description;$env[description]]
  $return[$js[
    (() => {
      const maxTitle = ${suggestionEditFields.title.max}
      const maxDescription = ${suggestionEditFields.description.max}
      const title = String(ctx.getKeyword('title') ?? '').trim()
      const description = String(ctx.getKeyword('description') ?? '').trim()
      let error = ''
      if (!title || !description) error = 'Both the title and the description are required.'
      else if (title.length > maxTitle) error = 'The title can be at most ' + maxTitle + ' characters.'
      else if (description.length > maxDescription) error = 'The description can be at most ' + maxDescription + ' characters.'
      return JSON.stringify({ fields: { title, description }, error })
    })()
  ]]
  `,
});
