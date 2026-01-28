module.exports.normalize = function normalize(str) {
    // //remove all spaces
    // str = str.replace(/\s/g, '');
    return str?.toString().trim().toLowerCase()
}