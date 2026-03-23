Analyze all uncommitted changes in the current Git repository following the git-commit-conventions skill in .claude/skills/.

Step by step:

1. Run `git status` and `git diff` to review all changes
2. Group changes into logical units — each unit becomes one atomic commit
3. Show me the proposed commit plan: list each commit with its type, scope, message, and which files it includes
4. Wait for my confirmation before executing any git commands
5. After I confirm, stage and commit each group in the correct order (infra → refactor → feat/fix → test → docs)
6. Show the final `git log --oneline` summary