module.exports = {
    ////////////// COMMON //////////////
    removeDuplicates (arr) { // [1,2,2,3,4,5,1]   ==>   [1,2,3,4,5]

        return arr.filter ((el, pos, a) => (a.indexOf(el) == pos) && el );
    },
    prettifyList (input) { // ",a, b ,,b   ,,  c,d,d,"   ==>   [a, b, c, d]
        let arr = input
            .split (',')
            .filter (s => s != '')
            .map (s => s.trim());

        return this.removeDuplicates (arr);
    },
    getRegexCaptures (string, regex, callback) { // "abcde" + /b(.*)e/   ==>   ["cd"]
        let matches, result = [];

        while ((matches = regex.exec(string)) !== null) {
            if (matches.index === regex.lastIndex) regex.lastIndex++; // This is necessary to avoid infinite loops with zero-width matches
            callback (matches.splice(1), result);
        }

        return result;
    },


    ////////////// PARSER //////////////
    createParser (templateString) { // makes a Regexp with a property contains a list of Template fields (Captures)
        const template = (typeof templateString == 'string') ? templateString : '';
        let parser = createRegex (template);

        parser.template = template; // Stores template string parser for future purposes
        parser.captures = this.getRegexCaptures ( // an array of names of template data fields
            template,
            /<m>[\s\S]*?<(\w+)>|<>.*<(\w+)>/g,
            (matches, result) => result.push (matches[0] || matches[1])
        );
        return parser;

        function createRegex (template) {
            let mask = template
                .replace (/<m>[\s\S]*?<\w+>/g, '([\\s\\S]*?)')  // a multi-line field
                .replace (/<>.*<\w+>/g, '(.*)')          // a single-line field

            return new RegExp (mask, 'g');
        }
    },
    parse (inputString, parser) { // return a Record object if count of Records == 1, else an array of them
        let result = this.getRegexCaptures (
            inputString,
            parser,
            (matches, result) => {
                let record = Object.assign (...parser.captures.map ( (prop, i) => {  // makes Obj from 2 Arrays
                    let match = matches[i]
                        .replace(/<m>([\s\S]*?)<\w+>/g, '$1')
                        .replace(/<>(.*)<\w+>/g, '$1')
                    return { [prop]: match };
                }) );

                result.push (record);
            }
        );
        if (!result.length) return false;

        return (result.length == 1)? result[0]: result;
    },


    ////////////// USEFUL FUNCTIONS //////////////
    stringifyVal (val) { // creates a string from any JS type
        if ((typeof val === 'undefined') || (val === null)) return '';
        if ((typeof val === 'boolean') || (typeof val === 'number') || (typeof val === 'string'))
            return val + '';

        if (val instanceof Array) return val.join(', ');
        if ((typeof val === 'symbol') || (typeof val === 'function')) return val.toString();

        return JSON.stringify (val);
    },
    fillTemplate (object, parser) { // creates a string from an object according to a Parser's template
        const stringify = this.stringifyVal.bind (this);

        return parser.captures.reduce (insertValueToTemplate, parser.template);

        function insertValueToTemplate (template, prop) {
            let regex = new RegExp ('<.*>[\\s\\S]*?<'+ prop +'>', 'g');
            let data = stringify (object[prop]);
            return template.replace(regex, data);
        }
    },
    fillTemplatesArray (array, parser) { // creates a string from an array of objects according to a Parser's template

        return array.reduce ( (acc, record) => acc + this.fillTemplate (record, parser), '');
    },
    filterObject (sourceObj, parser) { // filters only properties enlisted in a Parser

        return Object.assign (...parser.captures.map( prop => ({[prop]: sourceObj[prop]}) ) );
    },
}
