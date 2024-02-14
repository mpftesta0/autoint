#!/bin/sh
# Resolve the path to the actual script, following symlinks
SCRIPT_PATH=$(readlink -f "$0" || realpath "$0")
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")

# Capture the command and shift so $@ contains the remaining arguments
command="$1"
shift

case "$command" in
  sync)
    # Execute the sync command script with any additional arguments
    exec sh "$SCRIPT_DIR"/sync.sh "$@"
    ;;
  *)
    echo "Unknown command: $command"
    exit 1
    ;;
esac
