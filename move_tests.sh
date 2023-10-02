#!/bin/bash

# Define the source directory where you want to start the search
source_dir="/mnt/c/Users/ZacharyPiazza/code/multi-language-bazel-monorepo/projects/flex_cc"

# Define the destination directory where you want to copy the matched files
destination_dir="/mnt/c/Users/ZacharyPiazza/code/multi-language-bazel-monorepo/projects/flex_cc/tests"

# Use the find command to locate Python files ending with "_test"
# -type f: Find files
# -name "*.py": Match files with a .py extension
# -name "*_test.py": Match files ending with _test.py
# -exec cp {} "$destination_dir" \;: Copy each matched file to the destination directory
# -exec rm {} \;: Remove each matched file from the source directory after copying
find "$source_dir" -type f -name "*.py" -name "*_test.py" -exec cp {} "$destination_dir" \; -exec rm {} \;
