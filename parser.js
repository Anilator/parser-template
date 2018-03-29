module.exports = class Parser {
    constructor (templateString) { // makes a Regexp with a property contains a list of Template fields (Captures)
        const template = (typeof templateString == 'string') ? templateString : '';
        this.regex = createRegex (template);

        this.template = template; // Stores template string parser for future purposes
        this.captures = this.getRegexCaptures ( // an array of names of template data fields
            template,
            /<m>[\s\S]*?<(\w+)>|<[u|l]?>.*<(\w+)>/g,
            (matches, result) => result.push (matches[0] || matches[1])
        );
        this.modifiers = this.getRegexCaptures ( // an array of types of template data fields: multi-line, uppercase, lowercase
            template,
            /<(.)?>[\s\S]*?<\w+>/g,
            (matches, result) => result.push (matches[0])
        );

        function createRegex (template) {
            let mask = template
                .replace (/[-[\]{}()*+?.^$|#]/g, '\\$&')       // escaping special chars
                .replace (/<m>[\s\S]*?<\w+>/g, '([\\s\\S]*?)')  // a multi-line field
                .replace (/<[u|l]?>.*<\w+>/g, '(.*)')          // a single-line field

            return new RegExp (mask, 'g');
        }
    }
    parse (string) { // return a Record object if count of Records == 1, else an array of them
        let result = this.getRegexCaptures (
            string,
            this.regex,
            (matches, result) => {
                let record = Object.assign (...this.captures.map ( (prop, i) => {  // makes Obj from 2 Arrays
                    let match = matches[i]
                        .replace(/<m>([\s\S]*?)<\w+>/g, '$1')
                        .replace(/<[u|l]?>(.*)<\w+>/g, '$1')
                    return { [prop]: match };
                }) );

                result.push (record);
            }
        );
        if (!result.length) return false;

        return result;
    }
    stringify (data, postprocess) { // fills a template string by an array of data objects
        if (data instanceof Array) {
            return data.reduce ( (acc, record) => {
                    const params = record.modifier;
                    let result = this.fillTemplate (record);
                    if (postprocess) result = postprocess (result, params);
                    return acc + result;
                }, 
                ''
            );
        } else {
            return this.fillTemplate (data);
        }
    }
    

    ////////////// SECONDARY FUNCTIONS //////////////
    removeDuplicates (arr) { // [1,2,2,3,4,5,1]   ==>   [1,2,3,4,5]

        // return [...(new Set(arr))];  this is faster for big arrays only
        return arr.filter ((el, pos, a) => (a.indexOf(el) == pos) && el );
    }
    prettifyList (string) { // ",a, b ,,b   ,,  c,d,d,"   ==>   [a, b, c, d]
        let arr = string
            .split (',')
            .filter (s => s != '')
            .map (s => s.trim());

        return this.removeDuplicates (arr);
    }
    getRegexCaptures (string, regex, callback) { // "abcde" + /b(.*)e/   ==>   ["cd"]
        let matches, result = [];

        while ((matches = regex.exec(string)) !== null) {
            if (matches.index === regex.lastIndex) regex.lastIndex++; // This is necessary to avoid infinite loops with zero-width matches
            callback (matches.splice(1), result);
        }

        return result;
    }
    stringifyVal (val) { // creates a string from any JS type
        if ((typeof val === 'undefined') || (val === null)) return '';
        if ((typeof val === 'boolean') || (typeof val === 'number') || (typeof val === 'string'))
            return val + '';

        if (val instanceof Array) return val.join(', ');
        if ((typeof val === 'symbol') || (typeof val === 'function')) return val.toString();

        return JSON.stringify (val);
    }
    fillTemplate (dataObject) { // creates a string from an object according to a Parser's template
        const stringify = this.stringifyVal.bind (this);
        const captures = this.captures;
        const modifiers = this.modifiers;

        let reg = new RegExp ('([\\s\\S]*?)'+ captures.map(c => `<.?>.*<${c}>`).join('([\\s\\S]*?)') +'([\\s\\S]*?)');
        let rep = '$1'+ captures.reduce ((acc, prop, i) => {
            let data = stringify (dataObject[prop]);
            let mod = modifiers[i];
            if (mod === 'u') data = data.toUpperCase();
            if (mod === 'l') data = data.toLowerCase();

            return acc + data +'$'+ (i+2);
        }, '');
        return this.template.replace (reg, rep);
    }
    filterObject (dataObject) { // filters only properties enlisted in a Parser
        const captures = this.captures;
        const modifiers = this.modifiers;

        return Object.assign (...captures.map ((prop, i) => {
            let data = dataObject[prop];
            if (typeof data === 'string') {
                let mod = modifiers[i];
                if (mod === 'u') data = data.toUpperCase();
                if (mod === 'l') data = data.toLowerCase();
            }

            return { [prop]: data };
        }));
    }
}
