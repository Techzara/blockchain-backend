const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')

var app = express()

const PORT = process.env.PORT || 3333

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

var routes = fs.readdirSync(path.join(__dirname, '/route'))
routes.forEach(routesFile => {
    if (routesFile.match(/\.js$/)) {
        var route = require(path.join(__dirname, '/route/', routesFile))
        route(app)
    }
})

app.listen(PORT, function() {
    console.log('server started on port ', PORT)
})