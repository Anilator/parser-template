module.exports = {
    getRegexCaptures (string, regex, callback) {
        let matches, result = [];

        while ((matches = regex.exec(string)) !== null) {
            if (matches.index === regex.lastIndex) regex.lastIndex++; // This is necessary to avoid infinite loops with zero-width matches
            callback (matches.splice(1), result);
        }

        return result;
    },
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
    stringifyObj (object, parser) { // creates a string from an object according to a Parser's template

        return parser.captures.reduce (insertValuesToTemplate, parser.template);

        function insertValuesToTemplate (template, prop) {
            let regex = new RegExp ('<.*>[\\s\\S]*?<'+ prop +'>', 'g');
            let data = object[prop];
            if (data instanceof Array) data = data.join(', ');

            return template.replace(regex, data);
        }
    },
    stringifyArr (base, parser) { // creates a string from an array of objects according to a Parser's template

        return base.reduce ( (acc, record) => acc + this.stringifyObj (record, parser), '');
    },
}
