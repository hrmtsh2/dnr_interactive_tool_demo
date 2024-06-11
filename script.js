// rulesetFilePaths[] is an array of objects, each with the following signature:-
//{
//  rulestFilePath: 'path/to/ruleset1.json',
//  rulesetId: 'ruleset1'
//}

let rulesetFilePaths = [];

// rules[] is an array of objects, each with the following signature:-
//{
//    urlFilter: 'abc*def',
//    ruleset: 'ruleset1',
//    ruleId: 'rule1'
//}
let urlFilterStrings = [];

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

// Demo for urlFilterParse
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


// Uploading and displaying manifest file
const manifestFileInput = document.getElementById('manifestFileInput');
manifestFileInput.addEventListener('change', (event) => {
    const manifestFile = event.target.files[0];
    if(manifestFile){
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const manifestObject = JSON.parse(e.target.result);
                displayRulesetFilePaths(manifestObject);
            } catch(error){
                console.log("Error parsing manifest JSON: ", error);
                document.getElementById('fileInfo').textContent = 'Error parsing manifest.json file';
            }
        }
        reader.readAsText(manifestFile);
    }
});

// Display the paths for the ruleset files, as defined in the manifest
function displayRulesetFilePaths(manifest){
    const fileInfo = document.getElementById('manifestFileInfo');
    let output = '<h3>Ruleset Files:</h3><ul>';    
    if(manifest.declarative_net_request.rule_resources){
        manifest.declarative_net_request.rule_resources.forEach(ruleset => {
            output += `<li>${ruleset.id}: ${ruleset.path}, Enabled: ${ruleset.enabled}</li>`;
            rulesetFilePaths.push({rulesetFilePath: ruleset.path, rulesetId: ruleset.id});
        });
        output += '</ul>';
        console.log(rulesetFilePaths)
        fileInfo.innerHTML = output;     
    }
}

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
                    displayRules(rulesetObject);
                    // console.log(ruleObject); correct
                } catch(error){
                    console.log("Error parsing rule files: ", error);
                    document.getElementById('ruleFilesInfo').textContent = 'Error parsing rule file';
                }
            }
            reader.readAsText(file);            
            // console.log(file); correct
        }        
        // console.log(files); correct        
    }
});

// Display rules defined in a ruleset
function displayRules(rulesetObject){
    const ruleFilesInfo = document.getElementById('ruleFilesInfo');
    const fileInfo = document.createElement('div');
    let output = `<h3>Ruleset ${rulesetObject.rulesetId}: </h3><ul>`;
    rulesetObject.ruleset.forEach(rule => {
        const urlFilterString = rule.condition.urlFilter;
        const ruleID = rule.id;
        let ruleIsValid = "";
        if(checkRuleValidity(rule)){
            ruleIsValid = "Valid.";
        } else {
            ruleIsValid = "Invalid.";
        }
        output += `<li>${ruleID}: URLFilter String = ${urlFilterString}, Rules Validity: ${ruleIsValid}`; // for now this much info suffices
        output += '</li>';
        let indexedRule = urlFilterParse(rule.condition.urlFilter);

    });
    output += '</ul>';
    fileInfo.innerHTML = output;
    ruleFilesInfo.appendChild(fileInfo);
}


// Checks validity of rule, including checking validity of its condition, i.e., the URLFilter string
function checkRuleValidity(rule){
    let isValid = true;
    console.log(rule);
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
        console.log('urlFilter');
        console.log(rule.condition.urlFilter + " - " + isValidURLFilter(rule.condition.urlFilter)); // correct
    }
    // console.log(rule.condition.urlFilter + " - " + isValidURLFilter(rule.condition.urlFilter)); // correct
    return isValid;
}

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