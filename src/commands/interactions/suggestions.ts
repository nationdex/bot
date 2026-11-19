import { command } from '../../core/define/commands';
import { suggestionLimits } from '../../config/suggestions';

export default command('interaction.suggestions', `
  $arrayLoad[cid;-;$customID]
  $onlyIf[$arrayAt[cid;0]==suggestion]
  $let[action;$arrayAt[cid;1]]
  $if[$startsWith[$get[action];q];
    $onlyIf[$hasCap[$authorID;suggestions.review];
      $err[not_bot_staff;true]
    ]
    $if[$or[$get[action]==qa;$get[action]==qam;$get[action]==qc;$get[action]==qcm;$get[action]==qd;$get[action]==qdm;$get[action]==qch;$get[action]==qoff];
      $onlyIf[$hasCap[$authorID;suggestions.approve];
        $err[not_bot_staff;true]
      ]
    ]
  ]

  $ifx[
    $if[$get[action]==vote;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;vote]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $if[$hasVotedSuggestion[$get[id];$authorID];
        $!removeSuggestionVote[$get[id];$authorID]
      ;
        $!addSuggestionVote[$get[id];$authorID]
      ]
      $interactionUpdate[
        $disableAllMentions
        $suggestionEmbed[$get[id]]
      ]
    ]

    $elseIf[$get[action]==info;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;exists]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $jsonLoad[s;$getSuggestion[$get[id]]]
      $let[voted;$hasVotedSuggestion[$get[id];$authorID]]
      $ifx[
        $if[$env[s;submitterId]==$authorID;
          $let[hint;This is your suggestion. Open \`/suggestions browse\`, pick it and use **Edit** or **Withdraw** while it is open.]
        ]
        $elseIf[$hasCap[$authorID;suggestions.review];
          $let[hint;Staff: review it from \`/admin suggestions\`.]
        ]
        $else[
          $let[hint;Upvote suggestions you would like to see. Staff review the most voted ones first.]
        ]
      ]
      $interactionReply[
        $ephemeral
        $addContainer[
          $addTextDisplay[## Suggestion #$get[id]
$get[hint]
-# $if[$get[voted];You have upvoted this suggestion.;You have not upvoted this suggestion yet.]]
        ;$jsonVar[config;accent]]
      ]
    ]

    $elseIf[$get[action]==b;
      $interactionUpdate[
        $suggestionList[browse;$arrayAt[cid;2];$arrayAt[cid;3]]
      ]
    ]

    $elseIf[$get[action]==bf;
      $interactionUpdate[
        $suggestionList[browse;$selectMenuValues[0];1]
      ]
    ]

    $elseIf[$get[action]==bs;
      $let[id;$selectMenuValues[0]]
      $let[deny;$suggestionAccess[$get[id];$authorID;exists]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $interactionUpdate[
        $suggestionEmbed[$get[id];browse;$arrayAt[cid;2];$arrayAt[cid;3]]
      ]
    ]

    $elseIf[$get[action]==bd;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;exists]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $interactionUpdate[
        $suggestionEmbed[$get[id];browse;$arrayAt[cid;3];$arrayAt[cid;4]]
      ]
    ]

    $elseIf[$get[action]==dv;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;vote]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $if[$hasVotedSuggestion[$get[id];$authorID];
        $!removeSuggestionVote[$get[id];$authorID]
      ;
        $!addSuggestionVote[$get[id];$authorID]
      ]
      $interactionUpdate[
        $suggestionEmbed[$get[id];browse;$arrayAt[cid;3];$arrayAt[cid;4]]
      ]
      $!refreshSuggestion[$get[id]]
    ]

    $elseIf[$get[action]==edit;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;ownerOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $interactionUpdate[
        $suggestionEditMenu[$get[id];$arrayAt[cid;3];$arrayAt[cid;4]]
      ]
    ]

    $elseIf[$get[action]==ef;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;ownerOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $suggestionEditModal[$get[id];$selectMenuValues[0];$arrayAt[cid;3];$arrayAt[cid;4]]
    ]

    $elseIf[$get[action]==em;
      $let[id;$arrayAt[cid;2]]
      $let[field;$arrayAt[cid;3]]
      $let[deny;$suggestionAccess[$get[id];$authorID;ownerOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $jsonLoad[s;$getSuggestion[$get[id]]]
      $jsonLoad[fields;$env[s;fields]]
      $ifx[
        $if[$or[$get[field]==spawn_art;$get[field]==window_art];
          $deferUpdate
          $let[url;$input[value]]
          $let[kind;$if[$get[field]==spawn_art;spawn;window]]
          $let[token;u$authorID-$getTimestamp]
          $let[file;$suggestionArt[$get[url];$get[token]_$get[kind]]]
          $onlyIf[$get[file]!=;
            $suggestionFollowUpError[suggestion_bad_image]
          ]
          $if[$env[fields;$get[field]]!=;
            $try[$!deleteFile[${suggestionLimits.stagingDir}/$env[fields;$get[field]]];]
          ]
          $!jsonSet[fields;$get[field];$get[file]]
          $!updateSuggestion[$get[id];pending;$jsonStringify[fields];$if[$get[kind]==spawn;$get[url];];$if[$get[kind]==window;$get[url];]]
        ]
        $else[
          $jsonLoad[r;$suggestionSetField[$env[s;fields];$get[field];$input[value]]]
          $onlyIf[$env[r;error]==;
            $err[$env[r;error];true]
          ]
          $onlyIf[$env[r;changed];
            $err[suggestion_no_changes;true]
          ]
          $!updateSuggestion[$get[id];pending;$env[r;fields]]
        ]
      ]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[-# Updated **$replace[$get[field];_; ]**. The suggestion is back in the review queue.]
        ;#2ECC71]
        $suggestionEmbed[$get[id];browse;$arrayAt[cid;4];$arrayAt[cid;5]]
      ]
      $!refreshSuggestion[$get[id]]
    ]

    $elseIf[$get[action]==wd;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;ownerOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $jsonLoad[s;$getSuggestion[$get[id]]]
      $let[label;$if[$env[s;type]==nation;$env[s;fields;name];$env[s;fields;title]]]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[## Withdraw suggestion #$get[id]?]
          $addSeparator
          $addTextDisplay[- **Suggestion:** $get[label]
- **Votes:** $env[s;voteCount]
- This deletes the suggestion, its votes and its uploaded art.
-# This cannot be undone.]
          $addActionRow
          $addButton[suggestion-wdy-$get[id]-$arrayAt[cid;3]-$arrayAt[cid;4];Withdraw;Danger;🗑️]
          $addButton[suggestion-bd-$get[id]-$arrayAt[cid;3]-$arrayAt[cid;4];Cancel;Secondary;↩️]
        ;#E74C3C]
      ]
    ]

    $elseIf[$get[action]==wdy;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;ownerOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $jsonLoad[s;$getSuggestion[$get[id]]]
      $!deleteSuggestion[$get[id]]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[## Suggestion #$get[id] withdrawn]
          $addSeparator
          $addTextDisplay[-# The suggestion and its votes were removed.]
          $addActionRow
          $addButton[suggestion-b-$arrayAt[cid;3]-$arrayAt[cid;4];Back to suggestions;Secondary;↩️]
        ;$jsonVar[config;accent]]
      ]
      $if[$and[$env[s;channelId]!=;$env[s;messageId]!=];
        $try[$!deleteMessage[$env[s;channelId];$env[s;messageId]];]
      ]
      $if[$env[s;fields;spawn_art]!=;
        $try[$!deleteFile[${suggestionLimits.stagingDir}/$env[s;fields;spawn_art]];]
      ]
      $if[$env[s;fields;window_art]!=;
        $try[$!deleteFile[${suggestionLimits.stagingDir}/$env[s;fields;window_art]];]
      ]
    ]

    $elseIf[$get[action]==fm;
      $let[gate;$suggestionGate[$authorID]]
      $onlyIf[$get[gate]==;
        $err[$get[gate];true]
      ]
      $jsonLoad[built;$suggestionFeatureFields[$input[title];$input[description]]]
      $onlyIf[$env[built;error]==;
        $err[$env[built;error];true]
      ]
      $let[id;$createSuggestion[feature;$authorID;$env[built;fields]]]
      $interactionReply[
        $ephemeral
        $addContainer[
          $addTextDisplay[-# Your suggestion was submitted. You will get a DM when it is resolved.]
        ;#2ECC71]
        $suggestionEmbed[$get[id];browse;mine;1]
      ]
      $!publishSuggestion[$get[id]]
    ]

    $elseIf[$get[action]==q;
      $interactionUpdate[
        $suggestionList[queue;$arrayAt[cid;2];$arrayAt[cid;3]]
      ]
    ]

    $elseIf[$get[action]==qf;
      $interactionUpdate[
        $suggestionList[queue;$selectMenuValues[0];1]
      ]
    ]

    $elseIf[$get[action]==qs;
      $let[id;$selectMenuValues[0]]
      $let[deny;$suggestionAccess[$get[id];$authorID;exists]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $interactionUpdate[
        $suggestionEmbed[$get[id];queue;$arrayAt[cid;2];$arrayAt[cid;3]]
      ]
    ]

    $elseIf[$get[action]==qch;
      $setGlobalVar[suggestionsChannel;$selectMenuValues[0]]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[-# New suggestions will be posted in <#$selectMenuValues[0]> with vote buttons.]
        ;#2ECC71]
        $suggestionList[queue;$arrayAt[cid;2];$arrayAt[cid;3]]
      ]
    ]

    $elseIf[$get[action]==qoff;
      $setGlobalVar[suggestionsChannel;none]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[-# New suggestions will no longer be posted publicly.]
        ;#F1C40F]
        $suggestionList[queue;$arrayAt[cid;2];$arrayAt[cid;3]]
      ]
    ]

    $elseIf[$get[action]==qa;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;staffOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $jsonLoad[s;$getSuggestion[$get[id]]]
      $ifx[
        $if[$env[s;type]==nation;
          $modal[suggestion-qam-$get[id]-$arrayAt[cid;3]-$arrayAt[cid;4];Approve suggestion #$get[id]]
          $addLabel[Nation emoji;ID of an application emoji or of an emoji from a server the bot is in;
            $addTextInput[emoji;Nation emoji ID;Short;true;;;1;64]
          ]
          $addLabel[Note to the submitter;Optional;
            $addTextInput[note;Note;Paragraph;false;;;;500]
          ]
          $showModal
        ]
        $else[
          $deferUpdate
          $!resolveSuggestion[$get[id];approved;]
          $interactionUpdate[
            $addContainer[
              $addTextDisplay[-# Approved suggestion **#$get[id]**. The submitter was notified if their DMs are open.]
            ;#2ECC71]
            $suggestionList[queue;$arrayAt[cid;3];$arrayAt[cid;4]]
          ]
        ]
      ]
    ]

    $elseIf[$get[action]==qc;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;staffOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $modal[suggestion-qcm-$get[id]-$arrayAt[cid;3]-$arrayAt[cid;4];Request changes on #$get[id]]
      $addLabel[What needs to change?;Sent to the submitter, who can then edit the suggestion;
        $addTextInput[reason;Reason;Paragraph;true;;;1;500]
      ]
      $showModal
    ]

    $elseIf[$get[action]==qd;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;staffOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $modal[suggestion-qdm-$get[id]-$arrayAt[cid;3]-$arrayAt[cid;4];Deny suggestion #$get[id]]
      $addLabel[Reason;Optional, sent to the submitter;
        $addTextInput[reason;Reason;Paragraph;false;;;;500]
      ]
      $showModal
    ]

    $elseIf[$get[action]==qam;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;staffOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $jsonLoad[s;$getSuggestion[$get[id]]]
      $let[emojiIn;$trim[$input[emoji]]]
      $let[note;$input[note]]
      $let[emojiId;$appEmoji[$get[emojiIn];id]]
      $onlyIf[$get[emojiId]!=;
        $err[No application or server emoji has the ID \`$get[emojiIn]\`. Upload it to the application or to a server the bot is in first.;true]
      ]
      $deferUpdate
      $jsonLoad[res;$approveNationSuggestion[$get[id];$get[emojiId]]]
      $onlyIf[$env[res;ok];
        $suggestionFollowUpError[Approval failed: $env[res;error]]
      ]
      $jsonLoad[warnings;$env[res;warnings]]
      $!resolveSuggestion[$get[id];approved;$get[note]]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[-# Approved suggestion **#$get[id]**. **$env[s;fields;name]** was added to the catalog as \`#$env[res;id]\` and can spawn right away.$if[$arrayLength[warnings]>0;
Warnings: $arrayJoin[warnings;, ]]]
        ;#2ECC71]
        $suggestionList[queue;$arrayAt[cid;3];$arrayAt[cid;4]]
      ]
    ]

    $elseIf[$get[action]==qcm;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;staffOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $let[reason;$trim[$input[reason]]]
      $onlyIf[$get[reason]!=;
        $err[Give a reason so the submitter knows what to change.;true]
      ]
      $deferUpdate
      $!resolveSuggestion[$get[id];changes_requested;$get[reason]]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[-# Requested changes on suggestion **#$get[id]**. The submitter was notified if their DMs are open.]
        ;#F1C40F]
        $suggestionList[queue;$arrayAt[cid;3];$arrayAt[cid;4]]
      ]
    ]

    $elseIf[$get[action]==qdm;
      $let[id;$arrayAt[cid;2]]
      $let[deny;$suggestionAccess[$get[id];$authorID;staffOpen]]
      $onlyIf[$get[deny]==;
        $err[$get[deny];true]
      ]
      $deferUpdate
      $!resolveSuggestion[$get[id];denied;$trim[$input[reason]]]
      $interactionUpdate[
        $addContainer[
          $addTextDisplay[-# Denied suggestion **#$get[id]**. The submitter was notified if their DMs are open.]
        ;#E74C3C]
        $suggestionList[queue;$arrayAt[cid;3];$arrayAt[cid;4]]
      ]
    ]
  ]
`);
