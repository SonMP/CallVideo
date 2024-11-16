const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// Khởi tạo ứng dụng Express và HTTP server
const app = express();
const server = http.createServer(app);

// Cấu hình Socket.IO với CORS cho phép kết nối từ localhost:3000
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Chỉ cho phép kết nối từ localhost:3000
        methods: ["GET", "POST"], // Chỉ cho phép GET và POST
        allowedHeaders: ["Content-Type"], // Cho phép các tiêu đề cần thiết
        credentials: true, // Cho phép gửi cookies và chứng thực nếu cần
    },
});

// Lắng nghe sự kiện khi có người kết nối mới
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Gửi ID của người dùng khi kết nối thành công
    socket.emit("me", socket.id);

    // Xử lý sự kiện ngắt kết nối
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        socket.broadcast.emit("callEnded", socket.id); // Thông báo cho các người dùng khác về việc ngắt kết nối
    });

    // Xử lý yêu cầu cuộc gọi từ một người dùng
    socket.on("callUser", (data) => {
        console.log("Received call data:", data);

        if (!data.from || !data.userToCall) {
            console.error("Error: Missing 'from' or 'userToCall'");
            return;
        }

        // Kiểm tra xem người được gọi có đang online không
        const userToCallSocket = io.sockets.sockets.get(data.userToCall);
        if (userToCallSocket) {
            io.to(data.userToCall).emit("callUser", {
                signal: data.signalData,
                from: data.from,
                name: data.name,
            });
        } else {
            console.log(`User ${data.userToCall} is not available for call`);
        }
    });

    // Xử lý khi người nhận cuộc gọi đồng ý
    socket.on("answerCall", (data) => {
        console.log("Answer call received:", data);
        const userToCallSocket = io.sockets.sockets.get(data.to);
        if (userToCallSocket) {
            userToCallSocket.emit("callAccepted", data.signal); // Gửi tín hiệu "callAccepted"
        } else {
            console.log(`User ${data.to} is not online to answer the call`);
        }
    });
});

// Khởi động server và lắng nghe trên port 5000
server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
