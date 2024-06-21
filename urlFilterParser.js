// urlFilterParser.js

import { isValidURLFilter } from "./rules.js";

let indexedRuleTest = {}; // Object to store the parsed rule (since only one rule is parsed at a time, this variable is just for testing purposes)

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
    indexedRuleTest = indexedRule; // For testing purposes
}

// Create indexedRule object for given URLFilter string
function urlFilterParse(urlFilterString) {
    // const urlFilter = document.getElementById('urlFilterInput').value;
    let indexedRule = {};
    URLFilterParser.parse(urlFilterString, indexedRule);
    // document.getElementById('parsedRuleOutput').textContent = JSON.stringify(indexedRule, null, 2);
    return indexedRule;
}

// Test input urls against the generated indexedRule object
function urlFilterTest(){
    const testUrlElement = document.getElementById("testUrlInput");
    const testUrl = testUrlElement.value;
    const outputElement = document.getElementById("urlFilterTestOutput");
    const urlPattern = indexedRuleTest.urlPattern;

    if(!testUrlElement.checkValidity()){
        outputElement.textContent = "Invalid URL entered";
        return false;
    }
    if(indexedRuleTest.urlPatternType === 'SUBSTRING'){
        if(!testUrl.includes(urlPattern)){
            outputElement.textContent = "URL does not match the rule";
            return;
        }
    } else if(indexedRuleTest.urlPatternType === 'WILDCARDED'){
        let substrings = [];
        let string = "";
        for(let i = 0; i < urlPattern.length; i++){
            if(urlPattern[i] === '*' || urlPattern[i] === '^' || urlPattern[i] === '|'){
                if(string){
                    substrings.push(string);
                    string = "";
                }
            } else {
                string += urlPattern[i];
            }
        }
        substrings.push(string);
        let inOrder = testUrl.includes(substrings[0]);
        let x = substrings[0].length;
        for(let i = 1; i < substrings.length; i++){
            if(testUrl.indexOf(substrings[i], testUrl.indexOf(substrings[i - 1])) == -1){
                inOrder = false;
                break;
            }
        }
        console.log(substrings);
        console.log("In Order: " + inOrder);
        if(inOrder){
            // Separate checking based on whether * or ^
            // No special checking needed for * other than inOrder (?)
            // ^ matches only as many characters as ^'s 
            let prevIndex = 0;
            let x = 0;
            for(let i = 0; i < urlPattern.length; i++){
                if(urlPattern[i] === '^'){
                    let substr = substrings[x];
                    let index = testUrl.indexOf(substr, prevIndex);
                    // Characters NOT matched by ^ (separator):- abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.\%
                    let unmatchables = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.%";
                    if(unmatchables.includes(testUrl[index])){
                        outputElement.textContent = "URL does not match the rule";
                        console.log("URL does not match the rule");
                        return;
                    }            
                    prevIndex = index + substr.length;
                    x++;
                }
            }
        }
        if((indexedRuleTest.anchorLeft === 'BOUNDARY' || indexedRuleTest.anchorLeft === 'SUBDOMAIN') && (urlPattern[1] != '*' && urlPattern[1] != '^') && !testUrl.startsWith(substrings[0])){
            outputElement.textContent = "URL does not match the rule";
            console.log("URL does not match the rule");
            return;
        }
        if(indexedRuleTest.anchorRight === 'BOUNDARY' && (urlPattern[testUrl.length - 2] != '*' && urlPattern[testUrl.length - 2] != '^') && !testUrl.endsWith(substrings[substrings.length - 1])){
            outputElement.textContent = "URL does not match the rule";
            console.log("URL does not match the rule");
            return;
        }
    }
    outputElement.textContent = "URL matches the rule";
}

// {
//     anchorLeft: 'BOUNDARY' | 'SUBDOMAIN' | 'NONE',
//     urlPatternType: 'SUBSTRING' | 'WILDCARDED',
//     urlPattern: 'abc*def',
//     anchorRight: 'BOUNDARY' | 'NONE'
// }

document.getElementById("UrlFilterParseDemoButton").addEventListener("click", urlFilterParseDemo);
document.getElementById("UrlFilterTestButton").addEventListener("click", urlFilterTest);

// Export the class for use in other files
export { URLFilterParser, urlFilterParseDemo, urlFilterParse };