#!/bin/bash
set -e

echo "Fixing permissions on shell configuration files..."
# Check and fix .bash_profile
if [ -f "$HOME/.bash_profile" ]; then
    sudo chown $(whoami) "$HOME/.bash_profile"
fi

# Check and fix .zshrc
if [ -f "$HOME/.zshrc" ]; then
    sudo chown $(whoami) "$HOME/.zshrc"
fi

echo "Installing Rust..."
if ! command -v rustup &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
else
    echo "Rustup is already installed."
fi

echo "Source environment..."
source "$HOME/.cargo/env"

echo "Verifying Rust installation..."
cargo --version

echo "Building Tauri app..."
npm run tauri build
