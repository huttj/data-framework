var COL_WIDTH = 30;

var cwd = process.cwd();
var reg = new RegExp(/([^()]+)/);
var colors = {
    black   : '0',
    red     : '1',
    green   : '2',
    yellow  : '3',
    blue    : '4',
    magenta : '5',
    cyan    : '6',
    white   : '7'
};

function color(str, color, intense) {
    return [
        '\x1b[3',
        (colors[color] || colors.white),
        (intense ? ';1' : ''),
        'm',
        str,
        '\x1b[0m'
    ].join('');
}

function spaces(n) {
    if (n<1) return '';
    var s = '';
    while (n--) {
        s += ' ';
    }
    return s;
}

function pad(str, length) {
    return str + spaces(length - str.length);
}

function log() {
    var stack = new Error().stack;

    // The second line of Error.stack is this log function; the third is the
    // calling function. Get that line and pull out the calling function's
    // name and path
    var line = stack.split('\n')[2].match(/\s+at\s+(.+)/)[1].split(' ');

    // The calling function's name will be the first part of the line
    var fnName   = line[1] ? line[0] : '<anonymous>';

    // the path will be the last part of the line
    var fileName = line[line.length - 1].match(reg)[1]
        // Split on cwd to get the path minus the current working directory
        .split(cwd).join('').substr(1);

    // Add spaces to the end of each, to simulate table structure
    //stack = pad(color(fnName, 'magenta'), COL_WIDTH) + pad(color(fileName, 'yellow'), COL_WIDTH);
    var file = fileName.split(':');

    stack = color(file.shift(), 'green') + ':' + color(file.join(':'), 'yellow');

    // We're going to apply console.log, so we need to insert the stack into the arguments
    var args = Array.prototype.slice.call(arguments);
    args.unshift(stack);

    console.log.apply(console, args);
    console.log();
}

module.exports = log;