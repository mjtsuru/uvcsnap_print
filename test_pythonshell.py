import sys, json
import printer

# simple JSON echo script
for line in sys.stdin:
    files = json.loads(line)

#    print(files['list'])

    for filename in files['list']:
        printer.execPrint(filename)

    print(filename)
