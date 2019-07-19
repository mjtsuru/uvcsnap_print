from socketIO_client_nexus import SocketIO, LoggingNamespace
import printer

#Handler Functions
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

def execPrint(filename):
    printer.execPrint(filename)

#Processes
print(printer.getPrinterName())
print('start print')
execPrint('rental_temp4_chitto.png')
print('finished execPrint Func 1')
execPrint('rental_temp4_momoko.png')
print('finished execPrint Func 2')
print('finished print')

socketIO = SocketIO('localhost', 80, LoggingNamespace)
socketIO.on('connect', on_connect)
socketIO.on('disconnect', on_disconnect)
socketIO.on('reconnect', on_reconnect)

# Listen
socketIO.on('date', on_date_response)
socketIO.emit('test', {'value': 'from line'})
socketIO.on('message', on_message_response)


socketIO.wait(seconds=10)
