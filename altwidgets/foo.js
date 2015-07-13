(function() {
"use strict";
/*DEFINITIONS_REPLACEMENT*/

var state = {};
var i = 0, wd = null;
for (i = 0; i < widget_defs.length; i++) {
    wd = widget_defs[i];
    state[wd.name] = wd.value;
}

var widgets = [];

function enable_widgets() {
    for (var i = 0; i < widgets.length; i++) {
        widgets[i].enable();
    }
}

function disable_widgets() {
    for (var i = 0; i < widgets.length; i++) {
        widgets[i].disable();
    }
}

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
            enable_widgets();
        } else {
            // kind: 'result'
            output_area.text(data.data['text/plain']);
        }
    });
}

if (IPython.notebook.kernel) {
    connect();
    IPython.notebook.kernel.events.on('kernel_restarting.Kernel', disable_widgets);
} else {
    require(['base/js/events'], function(events) {
        events.on('kernel_connected.Kernel', connect);
        events.on('kernel_restarting.Kernel', disable_widgets);
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
        return {dom: control, js: {
            enable: function() {control.slider('enable');},
            disable: function() {control.slider('disable');}
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
    widgets.push(w.js);
}
widget_area.append(output_area);

})();
