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
        awid: awid,
        data: state
    });

    comm.on_msg(function(msg) {
        var data = msg.content.data.data;
        output_area.text(data['text/plain']);
    });
}

if (IPython.notebook.kernel) {
    connect();
} else {
    require(['base/js/events'], function(events) {
        events.on('kernel_connected.Kernel', function () {
            connect();
            for (var i = 0; i < enablers.length; i++) {
                enablers[i]();
            }
        });
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
            disabled: (!comm)
        }).css({'max-width': '30em', margin: '1em'});
        return {dom: control, enable: function() {
            control.slider('enable');
        }}
    }
};

var output_area = $('<div>');

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
