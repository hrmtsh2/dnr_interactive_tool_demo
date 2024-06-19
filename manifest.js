// manifest.js

let rulesetFilePaths = [];

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

// Export the variables and functions for use in other files
export { rulesetFilePaths, displayRulesetFilePaths, isValidManifest };
