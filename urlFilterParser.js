// urlFilterParser.js

import { isValidURLFilter } from "./rules.js";

// URLFilterParser: Class for parsing the URLFilter string of a rule, borrows generously from Chromium source code:-
// https://source.chromium.org/chromium/chromium/src/+/main:extensions/browser/api/declarative_net_request/indexed_rule.cc;l=47
// Helper class contaning methods to parse the URLFilter string of a rule
// Returns an object 'indexedRule' with the following signature:-
// {
//     anchorLeft: 'BOUNDARY' | 'SUBDOMAIN' | 'NONE',
//     urlPatternType: 'SUBSTRING' | 'WILDCARDED',
//     urlPattern: 'abc*def',
//     anchorRight: 'BOUNDARY' | 'NONE'
// }
class URLFilterParser {
    constructor(urlFilter, indexedRule) {
        this.urlFilter = urlFilter || '';
        this.urlFilterLen = this.urlFilter.length;
        this.index = 0;
        this.indexedRule = indexedRule;
    }
    static parse(urlFilter, indexedRule) {
        if (!indexedRule) {
            throw new Error('IndexedRule is required');
        }
        if(!isValidURLFilter(urlFilter)){
            throw new Error('Invalid URLFilter string');            
        }
        new URLFilterParser(urlFilter, indexedRule).parseImpl();
    }
    parseImpl() {
        this.parseLeftAnchor();
        console.assert(this.index <= 2, 'Index should be less than or equal to 2');

        this.parseFilterString();
        console.assert(this.index === this.urlFilterLen || this.index + 1 === this.urlFilterLen,
        'Index should be at the end or one before the end of urlFilter length');

        this.parseRightAnchor();
        console.assert(this.index === this.urlFilterLen, 'Index should be equal to urlFilter length');
    }
    parseLeftAnchor() {
        this.indexedRule.anchorLeft = 'NONE';
        if (this.isAtAnchor()) {
            ++this.index;
            this.indexedRule.anchorLeft = 'BOUNDARY';
            if (this.isAtAnchor()) {
                ++this.index;
                this.indexedRule.anchorLeft = 'SUBDOMAIN';
            }
        }
    }
    parseFilterString() {
        this.indexedRule.urlPatternType = 'SUBSTRING';
        let leftIndex = this.index;
        while (this.index < this.urlFilterLen && !this.isAtRightAnchor()) {
            if (this.isAtSeparatorOrWildcard()) {
                this.indexedRule.urlPatternType = 'WILDCARDED';
            }
            ++this.index;
        }
        this.indexedRule.urlPattern = this.urlFilter.substring(leftIndex, this.index);
    }
    parseRightAnchor() {
        this.indexedRule.anchorRight = 'NONE';
        if (this.isAtRightAnchor()) {
            ++this.index;
            this.indexedRule.anchorRight = 'BOUNDARY';
        }
    }
    isAtSeparatorOrWildcard() {
        return this.isAtValidIndex() && (this.urlFilter[this.index] === '^' || this.urlFilter[this.index] === '*');
    }
    isAtRightAnchor() {
        return this.isAtAnchor() && this.index > 0 && this.index + 1 === this.urlFilterLen;
    }
    isAtValidIndex() {
        return this.index < this.urlFilterLen;
    }
    isAtAnchor() {
        return this.isAtValidIndex() && this.urlFilter[this.index] === '|';
    }
}

// Demo for urlFilterParse()
function urlFilterParseDemo() {
    const urlFilter = document.getElementById('urlFilterInput').value;
    let indexedRule = {};
    URLFilterParser.parse(urlFilter, indexedRule);
    document.getElementById('parsedRuleOutput').textContent = JSON.stringify(indexedRule, null, 2);
}

// Create indexedRule object for given URLFilter string
function urlFilterParse(urlFilterString) {
    // const urlFilter = document.getElementById('urlFilterInput').value;
    let indexedRule = {};
    URLFilterParser.parse(urlFilterString, indexedRule);
    // document.getElementById('parsedRuleOutput').textContent = JSON.stringify(indexedRule, null, 2);
    return indexedRule;
}

document.getElementById("UrlFilterParseDemoButton").addEventListener("click", urlFilterParseDemo);

// Export the class for use in other files
export { URLFilterParser, urlFilterParseDemo, urlFilterParse };
