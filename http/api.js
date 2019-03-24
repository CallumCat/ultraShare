const fs = require("fs")

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
function getID(req) {
    var id = ""
    while (true) {
        id = randomString(global.config.fileName.length,global.config.fileName.allowedChars)
        if (!global.db.get({id: id})) {
            break
        }
    }
    if (req.header("id")) {
        if (!global.db.get({id: req.header("id")})) {
            id = req.header("id")
        }
    }
    return id
}

module.exports = function(app) {
    app.post("/api/login", function(req,res) {
        var data = ""
        req.on("data", function(d) {data += d})
        req.on("end", function() {
            console.log(data)
            var j = JSON.parse(data)
            if (j.username == global.config.username) {
                console.log(j)
            } else {
                res.status(401)
                res.send("invalid username")
            }
        })
    })


    app.get("/api/get", function(req,res) {
        console.log("[API]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization")
        if (global.config.apiKey == auth) {
            res.set({"Content-Type": "application/json"}) 
            res.send(JSON.stringify(global.db.get({})))
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.post("/api/upload", function(req,res) {
        console.log("[API]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization")
        if (global.config.apiKey == auth) {
            var id = getID(req)
            var stream = fs.createWriteStream("./files/" + id + "." + req.header("fileext"))
            req.pipe(stream)
            req.on("end", function() {
                global.db.add({
                    type:"file",
                    id:id,
                    file:id + "." + req.header("fileext"),
                    date: new Date(),
                    ua:req.header("User-Agent")})
                global.db.save()
                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id + "." + req.header("fileext")
                }))
            })
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
    app.post("/api/shorten", function(req,res) {
        console.log("[API]",req.ip, req.url, req.header("User-Agent"))
        var auth = req.header("Authorization")
        if (global.config.apiKey == auth) {
            var id = getID(req)
            var link = ""
            req.on("data", function(d) {
                link += d
            })
            req.on("end", function() {
                global.db.add({
                    type:"link",
                    id:id,
                    redir:link,
                    date: new Date(),
                    ua:req.header("User-Agent")})
                global.db.save()
                res.send(JSON.stringify({
                    id: id,
                    url: req.protocol + "://" + req.header("Host") + "/" + id
                }))
            })
        } else {
            res.status(401)
            res.send("invalid api key")
        }
    })
}