#!/usr/bin/env python
# encoding: utf-8
"""
Appcelerator Titanium Platform
Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
Licensed under the terms of the Apache Public License
Please see the LICENSE included with this distribution for details.
"""

import os
import sys

def usage():
    print "Usage: \npython juicerize.py [-o]"
    print '''\nOptions:
    -o  Enables JavaScript obfuscation'''

def main():
    juicer_params = '-a --nomunge ' #obfuscation off by default
    
    if len(sys.argv) > 1:
        arg_to_test = sys.argv[1]
        
        if arg_to_test in ("-h", "--help"):
            usage()
            sys.exit()
        elif arg_to_test == '-o':
            juicer_params = '' #enable obfuscation

    os.system("juicer merge -s --force " + juicer_params + "../javascript/index.js")
    os.system("juicer merge -s --force " + juicer_params + "../javascript/login.js")
    os.system("juicer merge --force ../stylesheets/tweetanium.css")
    os.system("juicer merge --force ../stylesheets/login.css")

if __name__ == "__main__":
    main()
