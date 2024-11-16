const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");

const io = socket(server, {
    cors: {
        origin: "http://localhost:3000", // Đảm bảo chỉ chấp nhận các yêu cầu từ localhost:3000
        methods: ["GET", "POST"], // Cho phép các phương thức GET và POST
    },
});

io.on("connection", (socket) => {
    // Gửi thông báo khi kết nối thành công
    socket.emit("me", socket.id);

    // Xử lý khi người dùng ngắt kết nối
    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    // Xử lý khi có cuộc gọi đến
    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", {
            signal: data.signal,
            from: data.from,
            name: data.name
        });
    });

    // Xử lý khi người nhận cuộc gọi trả lời
    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
