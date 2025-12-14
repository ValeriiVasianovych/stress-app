#!/bin/bash

VERSION=""

# get parameters
while getopts v: flag
do
  case "${flag}" in
    v) VERSION=${OPTARG};;
  esac
done

# Fetch all tags from remote
git fetch --tags --prune 2>/dev/null || true
git fetch --unshallow 2>/dev/null || true

# Get the latest tag by version number (not by commit date)
CURRENT_VERSION=$(git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)

if [[ $CURRENT_VERSION == '' ]]
then
  CURRENT_VERSION='v0.1.0'
fi
echo "Current Version: $CURRENT_VERSION"

# Remove 'v' prefix and split version
VERSION_NUMBER=${CURRENT_VERSION#v}
CURRENT_VERSION_PARTS=(${VERSION_NUMBER//./ })

VNUM1=${CURRENT_VERSION_PARTS[0]}
VNUM2=${CURRENT_VERSION_PARTS[1]}
VNUM3=${CURRENT_VERSION_PARTS[2]}

if [[ $VERSION == 'major' ]]
then
  VNUM1=$((VNUM1+1))
elif [[ $VERSION == 'minor' ]]
then
  VNUM2=$((VNUM2+1))
elif [[ $VERSION == 'patch' ]]
then
  VNUM3=$((VNUM3+1))
else
  echo "No version type (https://semver.org/) or incorrect type specified, try: -v [major, minor, patch]"
  exit 1
fi

NEW_TAG="v$VNUM1.$VNUM2.$VNUM3"
echo "($VERSION) updating $CURRENT_VERSION to $NEW_TAG"

# Check if the new tag already exists
GIT_COMMIT=$(git rev-parse HEAD)
if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
  TAG_COMMIT=$(git rev-parse "$NEW_TAG")
  if [ "$TAG_COMMIT" = "$GIT_COMMIT" ]; then
    echo "Tag $NEW_TAG already exists on current commit, reusing it"
  else
    echo "ERROR: Tag $NEW_TAG already exists on different commit ($TAG_COMMIT), current commit is $GIT_COMMIT"
    echo "This should not happen. Please check your tags."
    exit 1
  fi
else
  echo "Tagging commit $GIT_COMMIT with $NEW_TAG"
  git tag $NEW_TAG
  git push origin $NEW_TAG
fi

echo "git-tag=$NEW_TAG" >> $GITHUB_OUTPUT

exit 0