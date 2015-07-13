import json
import os
import uuid

from IPython.display import Javascript, display

# noinspection PyUnresolvedReferences
ip = get_ipython()

registry = {}

def altwidget_comm_target(comm, open_msg):
    data = open_msg['content']['data']
    altwidget_id = data['awid']
    try:
        w = registry[altwidget_id]
    except KeyError:
        return comm.close()

    comm.on_msg(w.handle_msg)
    w.call_callback(data['data'], comm)


ip.kernel.comm_manager.register_target('altwidget', altwidget_comm_target)

class Receiver:
    def __init__(self, callback):
        self.callback = callback

    def handle_msg(self, msg):
        sender_id = msg['content']['comm_id']
        sender = ip.kernel.comm_manager.get_comm(sender_id)
        data = msg['content']['data']
        assert data['kind'] == 'newstate'
        self.call_callback(data['data'], sender)

    def call_callback(self, data, comm):
        result = self.callback(data)
        format_dict, md_dict = ip.display_formatter.format(result)
        comm.send({
            'kind': 'result',
            'data': format_dict,
            'metadata': md_dict,
        })

def foo():
    r = Receiver(lambda x: x['a']*x['b'])
    awid = str(uuid.uuid4())
    registry[awid] = r

    widgets = [
        {'name': 'a',
         'kind': 'slider',
         'min': 0,
         'max': 10,
         'value': 5
        },
        {'name': 'b',
         'kind': 'slider',
         'min': 0,
         'max': 15,
         'value': 7
        },
    ]
    js_definitions = ("var awid = {!r};\n"
                      "var widget_defs = {};\n").format(awid, json.dumps(widgets))

    js_file = os.path.join(os.path.dirname(__file__), 'foo.js')
    with open(js_file) as f:
        j = f.read().replace('/*DEFINITIONS_REPLACEMENT*/', js_definitions)
    display(Javascript(j))
