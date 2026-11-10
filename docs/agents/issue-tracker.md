# Issue tracker: GitHub

Issues and specs live in joshrpr/Archery_Scores on GitHub.
Use the gh CLI from this repo.

## Conventions

- Before creating the first issue in a session, verify the target with
  `gh repo view --json nameWithOwner`.
- Create: `gh issue create --title "..." --body-file <path>`.
  Use a temporary UTF-8 file for multiline bodies.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,body,labels`.
  Add label and state filters as needed.
- Comment: `gh issue comment <number> --body-file <path>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."`
  or `--remove-label "..."`.
- Close: post the explanation as a comment, then
  `gh issue close <number>`.
- Represent parent-child relationships with native sub-issues when
  supported. Otherwise, put `Part of #<parent>` at the top of the
  child body and add it to the parent's task list.
- Represent blockers with native issue dependencies when supported.
  Otherwise, put `Blocked by: #<number>` at the top of the issue body.
  Work is unblocked when every blocker is closed.

File issues only in the user's repository.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill operations

When a skill says "publish to the issue tracker", create a GitHub issue.
When a skill says "fetch the relevant ticket", read the GitHub issue.
