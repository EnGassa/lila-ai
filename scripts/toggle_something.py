#!/usr/bin/env python3
import os
import subprocess
import sys

def main():
    # Get the project root directory (assumed to be the git root)
    try:
        repo_root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"]).decode().strip()
    except subprocess.CalledProcessError:
        print("Error: Could not determine git repository root.")
        sys.exit(1)

    target_file = os.path.join(repo_root, "something")
    file_rel_path = "something" # path relative to repo root for git commands

    if os.path.exists(target_file):
        print(f"'{file_rel_path}' exists. Removing and committing...")
        # git rm removes the file and stages the deletion
        subprocess.run(["git", "rm", file_rel_path], cwd=repo_root, check=True)
        subprocess.run(["git", "commit", "-am", "rm something"], cwd=repo_root, check=True)
    else:
        print(f"'{file_rel_path}' does not exist. Creating and committing...")
        # touch the file
        open(target_file, 'a').close()
        # We must add it before committing, as 'commit -a' doesn't pick up new untracked files
        subprocess.run(["git", "add", file_rel_path], cwd=repo_root, check=True)
        subprocess.run(["git", "commit", "-am", "touch something"], cwd=repo_root, check=True)
    subprocess.run(["git", "push"], cwd=repo_root, check=True)
    print("Done.")

if __name__ == "__main__":
    main()
