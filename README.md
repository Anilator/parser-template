# Parser

"**Parser**" is a tool designed for extracting data from plain text files.

## Usage

Let's say, we have some template filled with values:

```html
Hello, mr. Doe. How are you?
```

The only changable part of this template is a Name and we need to parse it. We may describe this template:

```html
Hello, mr. <><name>. How are you?
```

The rest is easy:

```js
const PARSER = require ('parser-template');
const myParser = new PARSER ('Hello, mr. <><name>. How are you?');
const data = myParser.parse (inputString)[0];
// data = {name: 'Doe'}
```

.

## Advanced usage

**Parser** can process an array of templates without additional params:

```html
Hello, mr. Doe. How are you?
Hello, mr. John. How are you?
Hello, mr. Bill. How are you?
```

```js
//...
const myParser = new PARSER ('Hello, mr. <><name>. How are you?');
const data = myParser.parse (inputString);
// data = [{name: 'Doe'}, {name: 'John'}, {name: 'Bill'}]
```

A template may contain several multi-line fields. They are marked by symbol 'm' in the opening part of a tag:

```html
Hello, <><name>.
This is that I think about you:
<m><text>
```

It's also possible to insert your data into a template string using `myParser.stringify (dataObject)`.

## Additional functions

**Parser** is shipped with several handy functions:

1) removeDuplicates (arr)
2) prettifyList (string)
3) getRegexCaptures (string, regex, callback)
4) stringifyVal (val)
5) filterObject (dataObject)

An info about them will be written in future.