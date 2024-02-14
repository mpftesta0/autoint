#!/bin/sh
# Resolve the path to the actual script, following symlinks
SCRIPT_PATH=$(readlink -f "$0" || realpath "$0")
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")

# Now, $SCRIPT_DIR contains the actual path to the script's directory.
# From here, you can adjust the path to find your module's files.

# Assuming the script is directly inside the module's bin directory, and
# you want to access something in the scripts/ directory at the root of your module
MODULE_DIR=$(dirname "$SCRIPT_DIR")  # Go up one level to the module root
TS_SCRIPT_PATH="$MODULE_DIR/scripts/updateAssistants.ts"

# Execute the TypeScript script using tsx, assuming .env is in the module root
exec npx tsx --env-file .env "$TS_SCRIPT_PATH" "$@"
