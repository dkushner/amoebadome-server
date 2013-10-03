var socket = io.connect(window.location.hostname);

socket.on('amoeba', function (data) {
   // $('#status').html(data.status);
});

$('#reset').click(function() {
    socket.emit('reset');
});