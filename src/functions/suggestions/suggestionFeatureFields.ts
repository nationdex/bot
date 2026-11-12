import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionEditFields } from '../../config/suggestions';

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
  $let[title;$trim[$if[$env[title]!=null;$env[title];]]]
  $let[description;$trim[$if[$env[description]!=null;$env[description];]]]
  $let[error;none]
  $ifx[
    $if[$or[$get[title]==;$get[description]==];
      $let[error;Both the title and the description are required.]
    ]
    $elseif[$charCount[$get[title]]>${suggestionEditFields.title.max};
      $let[error;The title can be at most ${suggestionEditFields.title.max} characters.]
    ]
    $elseif[$charCount[$get[description]]>${suggestionEditFields.description.max};
      $let[error;The description can be at most ${suggestionEditFields.description.max} characters.]
    ]
  ]
  $jsonLoad[res;{}]
  $jsonLoad[f;{}]
  $!jsonSet[f;title;$get[title]]
  $!jsonSet[f;description;$get[description]]
  $!jsonSet[res;fields;$env[f]]
  $!jsonSet[res;error;$if[$get[error]!=none;$get[error];]]
  $return[$env[res]]
  `,
});
