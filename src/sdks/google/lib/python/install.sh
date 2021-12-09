#!/usr/bin/env bash
cd "$(dirname $0)" || exit

# check python3 installed
if [[ $(command -v python3) == "" ]]; then
    sudo apt-get install -y gcc g++ make curl
    sudo apt-get install -y software-properties-common
    sudo apt-get install -y build-essential libssl-dev libffi-dev
    
    sudo apt-get -y update

    sudo apt-get install -y python3
    sudo apt-get install -y python3-dev
fi

# check pip3 installed
if [[ $(command -v pip3) == "" ]]; then
    sudo apt-get install -y python3-pip
fi

# pip3: pillow
pip3 install --timeout 100000 pillow

# pip3: install google-ads
pip3 install git+https://github.com/googleads/google-ads-python.git
pip3 install --timeout 100000 google-ads
