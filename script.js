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

let indexedRulesList = [];
// Contains list of indexedRule objects, each with the following signature:-
//{
//  TODO
//
//}

// URLFilterParser: Class for parsing the URLFilter string of a rule, borrows generously from Chromium source code:-
// https://source.chromium.org/chromium/chromium/src/+/main:extensions/browser/api/declarative_net_request/indexed_rule.cc;l=47
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
                let manifestSyntaxError = isValidManifest(manifestObject);
                if(manifestSyntaxError === true){ // if manifestSyntaxError is true, i.e., there are no errors
                    displayRulesetFilePaths(manifestObject);
                } else {
                    const fileInfoDiv = document.getElementById('manifestFileInfo');
                    let output = "<ul>";

                    for(let i = 0; i < manifestSyntaxError['type'].length; i++){
                        if(manifestSyntaxError['type'][i] === 'missingFields'){
                            let missingFields = manifestSyntaxError['missingFields'].join(', ');
                            // fileInfoDiv.textContent = `Missing fields: ${missingFields}`;
                            output += `<li>Missing fields: ${missingFields}</li>`;
                        }
                        if(manifestSyntaxError['type'][i] === 'invalidValueTypes'){
                            let invalidValueTypes = manifestSyntaxError['invalidValueTypes'].join(', ');
                            // fileInfoDiv.textContent = `Invalid value types for: ${invalidValueTypes}`;
                            output += `<li>Invalid value types for: ${invalidValueTypes}</li>`;
                        }
                        output += '</ul>';
                        fileInfoDiv.innerHTML = output;                    
                    }
                }
            } catch(error){
                console.log("Error parsing manifest JSON: ", error);
                document.getElementById('manifestFileInfo').textContent = 'Error parsing manifest.json file';
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
        // console.log(rulesetFilePaths); // correct
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
        if(isValidRule(rule)){
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

// Checks syntax and validity of the manifest file
function isValidManifest(manifest) {
    let syntaxError = {};
    syntaxError['type'] = [];

    // Check for required fields
    const requiredFields = ['name', 'version', 'manifest_version']; // "descripton" and "icon" required for web store
    const requiredFieldsTypes = ['string', 'string', 'number'];
    for (let i = 0; i < requiredFields.length; i++) {
        if (!manifest.hasOwnProperty(requiredFields[i])) {
            syntaxError.isError = true;
            syntaxError['type'].push('missingFields');
            syntaxError['missingFields'] = [];
            syntaxError['missingFields'].push(requiredFields[i]);
        }
        if(manifest.hasOwnProperty(requiredFields[i]) && (typeof manifest[requiredFields[i]] !== requiredFieldsTypes[i])){
            syntaxError.isError = true;
            if(!syntaxError['type'].includes('invalidValueTypes')){
                syntaxError['type'].push('invalidValueTypes');
                syntaxError['invalidValueTypes'] = [];
            }
            syntaxError['invalidValueTypes'].push(requiredFields[i]);
        }
    }

    const otherFields = [
        "action",
        "author",
        "background",
        "browser_action",
        "chrome_settings_overrides",
        "chrome_ui_overrides",
        "chrome_url_overrides",
        "commands",
        "content_security_policy",
        "content_scripts",
        "converted_from_user_script",
        "current_locale",
        "default_locale",
        "description",
        "devtools_page",
        "event_rules",
        "externally_connectable",
        "file_browser_handlers",
        "file_system_provider_capabilities",
        "homepage_url",
        "host_permissions",
        "icons",
        "import",
        "incognito",
        "input_components",
        "key",
        "minimum_chrome_version",
        "nacl_modules",
        "oauth2",
        "offline_enabled",
        "omnibox",
        "optional_permissions",
        "options_page",
        "options_ui",
        "page_action",
        "permissions",
        "platforms",
        "replacement_web_app",
        "requirements",
        "sandbox",
        "short_name",
        "sidebar_action",
        "storage",
        "tts_engine",
        "update_url",
        "version_name",
        "web_accessible_resources",
        "webview"
    ];
    
    const otherFieldTypes = [
        "object",   // action
        "string",   // author
        "object",   // background
        "object",   // browser_action
        "object",   // chrome_settings_overrides
        "object",   // chrome_ui_overrides
        "object",   // chrome_url_overrides
        "object",   // commands
        "string",   // content_security_policy
        "array",    // content_scripts
        "boolean",  // converted_from_user_script
        "string",   // current_locale
        "string",   // default_locale
        "string",   // description
        "string",   // devtools_page
        "array",    // event_rules
        "object",   // externally_connectable
        "array",    // file_browser_handlers
        "object",   // file_system_provider_capabilities
        "string",   // homepage_url
        "array",    // host_permissions
        "object",   // icons
        "array",    // import
        "object",   // incognito
        "object",   // input_components
        "string",   // key
        "string",   // minimum_chrome_version
        "array",    // nacl_modules
        "object",   // oauth2
        "boolean",  // offline_enabled
        "object",   // omnibox
        "array",    // optional_permissions
        "string",   // options_page
        "object",   // options_ui
        "object",   // page_action
        "array",    // permissions
        "object",   // platforms
        "object",   // replacement_web_app
        "object",   // requirements
        "object",   // sandbox
        "string",   // short_name
        "object",   // sidebar_action
        "object",   // storage
        "object",   // tts_engine
        "string",   // update_url
        "string",   // version_name
        "array",    // web_accessible_resources
        "object"    // webview
    ];
    
    for(let i = 0; i < otherFieldTypes.length; i++){
        if(manifest.hasOwnProperty(otherFields[i]) && (otherFieldTypes[i] !== "array") && (typeof manifest[otherFields[i]] !== otherFieldTypes[i])){
            syntaxError.isError = true;
            if(!syntaxError['type'].includes('invalidValueTypes')){
                syntaxError['type'].push('invalidValueTypes');
            }
            syntaxError['invalidValueTypes'].push(otherFields[i]);
        }
        if(manifest.hasOwnProperty(otherFields[i]) && (otherFieldTypes[i] === "array") && !Array.isArray(manifest[otherFields[i]])){
            syntaxError.isError = true;
            if(!syntaxError['type'].includes('invalidValueTypes')){
                syntaxError['type'].push('invalidValueTypes');
            }
            syntaxError['invalidValueTypes'].push(otherFields[i]);
        }
    }

    // if (manifest.manifest_version === 2) {
    //     // Specific checks for manifest v2
    // } else if (manifest.manifest_version === 3) {
    //     // Specific checks for manifest v3
    // }

    if(syntaxError.isError == true){
        console.log("manifest syntax error: ");
        console.log(syntaxError);        
        return syntaxError;
    } else {
        // console.log("isValidManifest: true"); // correct
        return true;
    }
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