from socketIO_client_nexus import SocketIO, LoggingNamespace

def on_connect():
    print('connect')
    socketIO.send({'val':'test'})
    socketIO.emit('test', {'value':'from on_connect'})

def on_disconnect():
    print('disconnect')

def on_reconnect():
    print('reconnect')

def on_date_response(*args):
    print('on_date', args)

def on_message_response(*args):
    print('received message', args)

socketIO = SocketIO('localhost', 80, LoggingNamespace)
socketIO.on('connect', on_connect)
socketIO.on('disconnect', on_disconnect)
socketIO.on('reconnect', on_reconnect)

# Listen
socketIO.on('date', on_date_response)
socketIO.emit('test', {'value': 'from line'})
socketIO.on('message', on_message_response)


socketIO.wait(seconds=10)
