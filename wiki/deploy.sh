#!/bin/bash
set -e # Exit with nonzero exit code if anything fails

SOURCE_BRANCH="master"

# Save some useful information
SSH_REPO="git@github.com:crossrails/compiler-wiki.git"
SHA=`git rev-parse --verify HEAD`

cd compiler.wiki

# Now let's go have some fun with the cloned repo
git config user.name "Travis CI"
git config user.email "travis@Travis"

#if [ -z `git diff --exit-code` ]; then
#    echo "No changes to the output on this push; exiting."
#    exit 0
#fi

# Commit the "changes", i.e. the new version.
# The delta will show diffs between new and old versions.
git add .
git commit -m "Deploy to GitHub Pages: ${SHA}"

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
#ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
#ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
#ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
#ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
#openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in deploy_key.enc -out deploy_key -d
#chmod 600 deploy_key
#eval `ssh-agent -s`
echo "AAAAB3NzaC1yc2EAAAADAQABAAACAQCaybxeFtzSR+SWWJvnUtLbWS4HaBeRSIO3nJfJgMQOA0tscWUPwSz00Wxk3Jelvib2MII3pP/g0Xg0i0I1egJZI7lc9HSb0cHKd/sJHVXqu6DEwJOy791r7JbDKLZq5+20SsNcT7WFQiRW3wkHwKSfAefEWxr05DzgLZZBLgdt8dBa+3EiCqg9qvXdVMj7K1bjjocyCEdYmfDwxHt6wJ8Ti/skvRZBHAVQqjnkQZwWjIm6vKuDUJLct4NNpjx8gVBTIOl1gf7W0Pq5F8IhnBGSvYnhoGdXNyN8bhnEbrSKZxbx5Ah8TC3MwH+RxKdE/P6THC8hghvAJ889dUfTgngiOvnYCG2blDMlbBH3afNJooo8kpKzww2vgvxToEsmm9c3FTedurDyhO9Mjr9ID7Dp6H8dni0cL87PenKMookXvOjSTsPDQVAnJgK7BAjx9C2QEwdwHhppzvt7P7Zd13i9YmYl2OdZDkqe/nt/RSz00WYjgWrT1k3sIuBo3P9ezJcs2aGAQZML1O95UbltGmBgc0Q2onRA5g59BWD1oZt6VzgHeRMlCGDBc5PVDWi41qx+G4ByJ06JViKw/iC0VYb4snb4WuqtFCAspTuIsXLixbQoEtR6rw9yF9M83gXEbLY7M9Rv2kTCZTaEL+Abyrk+b83ZoalYBC3HIFV4YudD5Q== travis@Travis" > ssh-rsa
ssh-add ssh-rsa

# Now that we're all set up, we can push.
git push $SSH_REPO $SOURCE_BRANCH