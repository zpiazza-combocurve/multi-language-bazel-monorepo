#!/bin/bash

# Define the directory where your files are located
directory="/mnt/c/Users/ZacharyPiazza/code/multi-language-bazel-monorepo/projects/flex_cc/tests"

# Go to the specified directory
cd "$directory" || exit

# Loop through all files in the directory
for file in *; do
    if [[ -f "$file" ]]; then
        # Check if the file name ends with "_test"
        if [[ "$file" == *_test.* ]]; then
            # Extract the file extension
            ext="${file##*.}"

            # Remove the "_test" suffix and add the "test_" prefix
            new_name="test_${file%_test*}.$ext"

            # Rename the file
            mv "$file" "$new_name"
            echo "Renamed: $file -> $new_name"
        fi
    fi
done
