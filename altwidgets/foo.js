(function() {
"use strict";
/*DEFINITIONS_REPLACEMENT*/

var state = {};
var i = 0, wd = null;
for (i = 0; i < widget_defs.length; i++) {
    wd = widget_defs[i];
    state[wd.name] = wd.value;
}

var enablers = [];

var comm = null;

function connect() {
    comm = IPython.notebook.kernel.comm_manager.new_comm('altwidget',{
        awid: awid
    });

    comm.on_msg(function(msg) {
        // We can open the comm even if the kernel doesn't know the awid, so
        // we need to wait for this confirmation message to enable widgets.
        var data = msg.content.data;
        if (data.kind === 'connected') {
            for (var i = 0; i < enablers.length; i++) {
                enablers[i]();
            }
        } else {
            // kind: 'result'
            output_area.text(data.data['text/plain']);
        }
    });
}

if (IPython.notebook.kernel) {
    connect();
} else {
    require(['base/js/events'], function(events) {
        events.on('kernel_connected.Kernel', connect);
    });
}

// TODO: More kinds of widgets
var widget_factories = {
    slider: function(wd) {
        var control = $('<div>').slider({
            min: wd.min,
            max: wd.max,
            value: wd.value,
            change: function(event, ui) {
                update_state(wd.name, ui.value);
            },
            disabled: true
        }).css({'max-width': '30em', margin: '1em'});
        return {dom: control, enable: function() {
            control.slider('enable');
        }}
    }
};

var output_area = $('<div>').text(starting_result['data']['text/plain']);

function update_state(key, val) {
    state[key] = val;
    if (comm) {
        comm.send({
            kind: 'newstate',
            data: state
        });
    }
}

var widget_area = $('<div>').appendTo(element);

for (i = 0; i < widget_defs.length; i++) {
    wd = widget_defs[i];
    var w = widget_factories[wd.kind](wd);
    widget_area.append(w.dom);
    enablers.push(w.enable);
}
widget_area.append(output_area);

})();
