// rules.js

import { urlFilterParse } from './urlFilterParser.js';
import { rulesetFilePaths } from './manifest.js';

let indexedRulesList = [];

// Uploading and displaying ruleset files
const filesInput = document.getElementById('ruleFilesInput');
filesInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if(files){
        for(const file of files){ 
            let rulesetIndex = 0;
            if(rulesetFilePaths.length != 0){
                for(const rulesetFilePathObject of rulesetFilePaths){
                    if(file.name === rulesetFilePathObject.rulesetFilePath){
                        rulesetIndex = rulesetFilePathObject.rulesetId;
                    }
                }                
            }           
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const rulesetJSONParsed = JSON.parse(e.target.result);
                    const rulesetObject = {
                        ruleset: rulesetJSONParsed,
                        rulesetId: rulesetIndex
                    }
                    if(isValidRuleset(rulesetObject.ruleset)){
                        displayRules(rulesetObject);
                    } else {
                        document.getElementById('ruleFilesInfo').textContent = `Invalid ruleset with id: ${rulesetObject.rulesetId}`;
                    } 
                    // console.log(ruleObject); correct
                } catch(error){
                    console.log("Error parsing rule files: ", error);
                    document.getElementById('ruleFilesInfo').textContent = 'Error parsing rule file';
                }
            }
            reader.readAsText(file);            
            // console.log(file); correct
            // console.log(indexedRulesList); // correct
        }        
        // console.log(files); correct        
    }
});

// Display rules defined in a ruleset
function displayRules(rulesetObject){
    const ruleFilesInfo = document.getElementById('ruleFilesInfo');

    const fileInfo = document.createElement('div');
    const header = document.createElement('h3');
    header.innerText = `Ruleset ${rulesetObject.rulesetId}:`;
    fileInfo.appendChild(header); 
    const list = document.createElement('ul');

    rulesetObject.ruleset.forEach(rule => {
        const urlFilterString = rule.condition.urlFilter;
        const ruleID = rule.id;
        let ruleIsValid = "";
        if(isValidRule(rule)){
            ruleIsValid = "Valid.";
        } else {
            ruleIsValid = "Invalid.";
        }
        const listItem = document.createElement('li');
        listItem.innerText = `${ruleID}: URLFilter String = ${urlFilterString}, Rules Validity: ${ruleIsValid}`;
        list.appendChild(listItem);

        let indexedRule = urlFilterParse(rule.condition.urlFilter);
        indexedRulesList.push({indexedRule, ruleId: ruleID, rulesetId: rulesetObject.rulesetId});
    });
    fileInfo.appendChild(list);
    ruleFilesInfo.appendChild(fileInfo);
}


// Checks validity of URLFilter string
function isValidURLFilter(urlFilterString) {
    // Ensure only valid constructs are present
    const validConstructs = /^[\*\|\^a-zA-Z0-9_\-\.%?/;=@&:]+$/;
    if (!validConstructs.test(urlFilterString)) {
        return false; // Invalid constructs present
    }
    // Check for ASCII characters
    for (let i = 0; i < urlFilterString.length; i++) {
        if (urlFilterString.charCodeAt(i) > 127) {
            return false; // Non-ASCII character found
        }
    }
    if(urlFilterString.startsWith('||*')){
        return false; // Cannot start with ||* - use only * at the beginning for the intended effect.
    }
    if(urlFilterString.includes('|') && !urlFilterString.includes('||')){
        if(!urlFilterString.startsWith('|') && !urlFilterString.endsWith('|')){
            return false; // Cannot start or end without |.
        }
        if(urlFilterString.length === 1){
            return false; // Cannot have only |.
        }
    }
    if(urlFilterString.includes('||')){
        if(!urlFilterString.startsWith('||')){
            return false; // Cannot have || in the middle.
        }
        if(urlFilterString.length === 2){
            return false; // Cannot have only ||.
        }
        if(urlFilterString.slice(2).includes('|') && !urlFilterString.endsWith('|')){
            return false; // Cannot have | in the middle.
        }
    }
    if(urlFilterString.slice(1, -1).includes('|') && urlFilterString.slice(0, 2) !== '||'){
        return false; // Cannot have | in the middle.
    }
    return true;
}

// Checks validity of rule, including checking validity of its condition, i.e., the URLFilter string
function isValidRule(rule){
    let isValid = true;
    // console.log(rule); // correct
    if(!rule.id || (rule.id && !Number.isInteger(rule.id))){
        isValid = false;
        console.log('id');
    }
    if(rule.priority && !Number.isInteger(rule.priority)){
        isValid = false;
        console.log('priority');
    }
    if(!rule.action || typeof rule.action != 'object' || !rule.action.type || (rule.action && typeof rule.action.type != 'string')){
        isValid = false;
        console.log('action');
    }
    if(!rule.condition || typeof rule.condition != 'object'){
        isValid = false;
        console.log('condition');
    }
    if(!isValidURLFilter(rule.condition.urlFilter)){
        isValid = false;
        // console.log('urlFilter'); // correct
        // console.log(rule.condition.urlFilter + " - " + isValidURLFilter(rule.condition.urlFilter)); // correct
    }
    // console.log(rule.condition.urlFilter + " - " + isValidURLFilter(rule.condition.urlFilter)); // correct
    return isValid;
}

// Checks syntax and validity of ruleset file
function isValidRuleset(ruleset) {
    // Check if the ruleset is an array and is non-empty
    if (!Array.isArray(ruleset) || ruleset.length === 0) {
        return false;
    }

    // Validate each rule in the ruleset
    for (let rule of ruleset) {
        if (!isValidRule(rule)) {
            return false;
        }
    }

    return true;
}

/* Some tests for isValidURLFilter
const testCases = [
    { input: 'abc', expected: true },
    { input: 'abc*d', expected: true },
    { input: '||a.example.com', expected: true },
    { input: 'example*^123|', expected: true },
    { input: '||*example', expected: false },
    { input: '|*example', expected: true },
    { input: 'abc|def', expected: false },
    { input: '||a|b', expected: false },
    { input: 'abc||def', expected: false },
    { input: 'abc||', expected: false },
    { input: 'abc|*def', expected: false },
    { input: 'abc^def', expected: true },
    { input: 'abc^|def', expected: false },
    { input: 'abc|^def', expected: false },
    { input: 'abc|def|', expected: false },
    { input: 'abc|def|ghi', expected: false },
    { input: 'abc|def||ghi', expected: false },
    { input: 'abc||def|ghi', expected: false },
    { input: '||*', expected: false },
    { input: '|', expected: false },
    { input: '||', expected: false },
    { input: '|something*^123/', expected: true },
    { input: '|*?no-cookies=1', expected: true}
];

// Run test cases
testCases.forEach(({ input, expected }) => {
    const result = isValidURLFilter(input);
    console.log(`isValidURLFilter("${input}") = ${result} (expected: ${expected})`);
});*/

// Export the variables and functions for use in other files
export { indexedRulesList, displayRules, isValidRule, isValidURLFilter, isValidRuleset};
