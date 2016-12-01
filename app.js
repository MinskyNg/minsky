var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var mongoose = require('mongoose');
var cors = require('cors');
var logger = require('morgan');
var debug = require('debug');
var ejs = require('ejs');
var errorHandler = require('errorhandler');


var app = express();
process.env.NODE_ENV = 'production';


/**
 * 初始化环境配置
 */
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/chat');
var port = normalizePort(process.env.PORT || '3000');
var views = path.join(__dirname, 'views');
app.set('port', port);
app.set('views', views);
app.engine('.html', ejs.__express);
app.set('view engine', 'html');


/**
 * 使用中间件
 */
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
if (app.get('env') === 'development') {
    app.use(errorHandler());
}


// 首页请求
app.get('/', function(req, res) {
    res.sendFile(path.join(views, 'home.html'));
});

// 简历请求
app.get('/resume', function(req, res) {
    res.sendFile(path.join(views, 'resume.html'));
});

// demo请求
app.get('/demo', function(req, res) {
    res.sendFile(path.join(views, 'demo.html'));
});

// 详细demo请求
app.get('/demo/:detail', function(req, res) {
    res.sendFile(path.join(views, req.params.detail + '.html'));
});

// 日记应用请求
app.get('/diary', function(req, res) {
    res.sendFile(path.join(views, 'diary.html'));
});

app.get('/diary/*', function(req, res) {
    res.sendFile(path.join(views, 'diary.html'));
});

// 聊天室请求
app.get('/chat', function(req, res) {
    res.sendFile(path.join(views, 'chat.html'));
});

/**
 * 加载聊天室路由
 */
// 在线用户列表
var onlineUsers = [{
    username: '图灵机器人',
    signature: '图灵机器人聊天API',
    avatar: 'http://7xnpxz.com1.z0.glb.clouddn.com/robot.png',
    msg: []
}];
var usersRouter = express.Router();
var groupRouter = express.Router();
require('./routes/group')(groupRouter);
require('./routes/user')(usersRouter, onlineUsers);
app.use('/chat', usersRouter);
app.use('/chat', groupRouter);

app.get('/chat/*', function(req, res) {
    res.sendFile(path.join(views, 'chat.html'));
});

app.get('/*', function(req, res) {
    res.sendFile(path.join(views, '404.html'));
});


/**
 * 错误处理
 */
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// 开发环境
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).send({
            message: err.message,
            error: err
        });
    });
}

// 生产环境
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message,
        error: {}
    });
});


/**
 * 服务器启动
 */
// 用户socket引用
var sockets = {};
var server = require('http').Server(app);
var io = require('socket.io')(server);
require('./socketEvents')(io, sockets, onlineUsers);
server.listen(app.get('port'), function() {
    console.log('Server runing at port:' + app.get('port'));
});
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize port.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // 命名管道
        return val;
    }

    if (port >= 0) {
        // 端口号
        return port;
    }

    return false;
}


/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}


/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
