import win32print
import win32ui
from PIL import Image, ImageWin

#
# Constants for GetDeviceCaps
#
#
# HORZRES / VERTRES = printable area
#
HORZRES = 8
VERTRES = 10
#
# LOGPIXELS = dots per inch
#
LOGPIXELSX = 80
LOGPIXELSY = 90
#
# PHYSICALWIDTH/HEIGHT = total area
#
PHYSICALWIDTH = 110
PHYSICALHEIGHT = 111
#
# PHYSICALOFFSETX/Y = left / top margin
#
PHYSICALOFFSETX = 110
PHYSICALOFFSETY = 113

printer_name = win32print.GetDefaultPrinter ()
file_name = "test.jpg"

def getPrinterName():
    return printer_name

def execPrint(file_name):
    #
    # You can only write a Device-independent bitmap
    #  directly to a Windows device context; therefore
    #  we need (for ease) to use the Python Imaging
    #  Library to manipulate the image.
    #
    # Create a device context from a named printer
    #  and assess the printable size of the paper.
    #
    hDC = win32ui.CreateDC ()
    hDC.CreatePrinterDC (printer_name)
    printable_area = hDC.GetDeviceCaps (HORZRES), hDC.GetDeviceCaps (VERTRES)
    printer_size = hDC.GetDeviceCaps (PHYSICALWIDTH), hDC.GetDeviceCaps (PHYSICALHEIGHT)
    printer_margins = hDC.GetDeviceCaps (PHYSICALOFFSETX), hDC.GetDeviceCaps (PHYSICALOFFSETY)

    print("printable_area ", printable_area)
    print("printer_size ", printer_size)
    print("printer_margins ", printer_margins)
    #
    # Open the image, rotate it if it's wider than
    #  it is high, and work out how much to multiply
    #  each pixel by to get it as big as possible on
    #  the page without distorting.
    #
    bmp = Image.open (file_name)
    if bmp.size[0] > bmp.size[1]:
      bmp = bmp.rotate (90)

    ratios = [1.0 * printable_area[0] / bmp.size[0], 1.0 * printable_area[1] / bmp.size[1]]
    scale = min (ratios)

    print("ratios ", ratios)
    print("scale ", scale)
    #
    # Start the print job, and draw the bitmap to
    #  the printer device at the scaled size.
    #
    hDC.StartDoc (file_name)
    hDC.StartPage ()

    dib = ImageWin.Dib (bmp)
    scaled_width, scaled_height = [int (scale * i) for i in bmp.size]
    # x1 = int ((printer_size[0] - scaled_width) / 2)
    # y1 = int ((printer_size[1] - scaled_height) / 2)
    # x2 = x1 + scaled_width
    # y2 = y1 + scaled_height
    x1 = 15
    y1 = 0
    x2 = 4722
    y2 = 6874

    dib.draw (hDC.GetHandleOutput (), (x1, y1, x2, y2))
    print("bmp.size ", bmp.size)
    print("scaled_width ", scaled_width)
    print("scaled_height ", scaled_height)
    print("x1 ", x1)
    print("y1 ", y1)
    print("x2 ", x2)
    print("y2 ", y2)

    hDC.EndPage ()
    hDC.EndDoc ()
    hDC.DeleteDC ()
