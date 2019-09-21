function initLocalStorage() {
    if (typeof (localStorage.scoreboard) == 'undefined') {
        console.log("Initializing scoreboard...");
        localStorage.scoreboard = "[]";
    }
}

function addScore(name, distance) {
    if (name === "") return;
    initLocalStorage();
    var u = JSON.parse(localStorage.scoreboard);
    var o = {
        name: name,
        distance: distance,
    };
    var ins_pos = undefined;
    for (var i = 0; i < u.length; i++) {
        if (u[i].name == undefined) {
            u.splice(i, 1);
            i--;
            continue;
        }
        if (u[i].name == name && u[i].distance == distance) return;
        if (u[i].distance <= distance) {
            ins_pos = i;
            break;
        }
    }
    if (ins_pos != undefined) u.insert(ins_pos, o);
    if (u.length == 0) u.push(o);
    else if (ins_pos == undefined) u.insert(u.length,o);
    if (u.length > 8) u.pop();
    localStorage.scoreboard = JSON.stringify(u);
}

function printScoreboard(elem) {
    initLocalStorage();
    var u = JSON.parse(localStorage.scoreboard);
    var text = "";
    for (var i = 0; i < u.length; i++) {
        text += (i + 1).valueOf() + ". " + u[i].name + " - " + u[i].distance.valueOf() + "<br/>";
    }
    if (text == "") text = "No score submitted";
    elem.innerHTML = text;
}
Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};